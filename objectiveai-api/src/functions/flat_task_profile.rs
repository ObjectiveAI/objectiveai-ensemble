//! Flattened execution data for function execution.
//!
//! Transforms nested Function and Profile definitions into a flat structure suitable
//! for parallel execution. A Function defines the task structure and expressions,
//! while a Profile provides the weights for each task. This module combines both
//! into flattened executable tasks.

use crate::ctx;
use futures::FutureExt;
use std::{pin::Pin, sync::Arc, task::Poll};

/// A flattened task ready for execution.
///
/// Combines Function structure with Profile weights into an executable node.
/// Can be a function (with nested tasks), a mapped array of functions, a vector
/// completion, or a mapped array of vector completions.
#[derive(Debug, Clone)]
pub enum FlatTaskProfile {
    /// A single function task with nested tasks.
    Function(FunctionFlatTaskProfile),
    /// Multiple function tasks from a mapped expression.
    MapFunction(MapFunctionFlatTaskProfile),
    /// A single vector completion task.
    VectorCompletion(VectorCompletionFlatTaskProfile),
    /// Multiple vector completion tasks from a mapped expression.
    MapVectorCompletion(MapVectorCompletionFlatTaskProfile),
}

impl FlatTaskProfile {
    /// Returns an iterator over all vector completion tasks.
    ///
    /// Recursively traverses function tasks to collect all leaf vector completions.
    pub fn vector_completion_ftps(
        &self,
    ) -> impl Iterator<Item = &VectorCompletionFlatTaskProfile> {
        enum Iter<'a> {
            Function(
                Box<
                    dyn Iterator<Item = &'a VectorCompletionFlatTaskProfile>
                        + 'a,
                >,
            ),
            MapFunction(
                Box<
                    dyn Iterator<Item = &'a VectorCompletionFlatTaskProfile>
                        + 'a,
                >,
            ),
            VectorCompletion(Option<&'a VectorCompletionFlatTaskProfile>),
            MapVectorCompletion(
                std::slice::Iter<'a, VectorCompletionFlatTaskProfile>,
            ),
        }
        impl<'a> Iterator for Iter<'a> {
            type Item = &'a VectorCompletionFlatTaskProfile;
            fn next(&mut self) -> Option<Self::Item> {
                match self {
                    Iter::Function(iter) => iter.next(),
                    Iter::MapFunction(iter) => iter.next(),
                    Iter::VectorCompletion(opt) => opt.take(),
                    Iter::MapVectorCompletion(iter) => iter.next(),
                }
            }
        }
        match self {
            FlatTaskProfile::Function(function) => Iter::Function(Box::new(
                function
                    .tasks
                    .iter()
                    .filter_map(|task| task.as_ref())
                    .flat_map(|task| task.vector_completion_ftps()),
            )),
            FlatTaskProfile::MapFunction(functions) => {
                Iter::MapFunction(Box::new(
                    functions
                        .functions
                        .iter()
                        .flat_map(|function| function.tasks.iter())
                        .filter_map(|task| task.as_ref())
                        .flat_map(|task| task.vector_completion_ftps()),
                ))
            }
            FlatTaskProfile::VectorCompletion(vector) => {
                Iter::VectorCompletion(Some(vector))
            }
            FlatTaskProfile::MapVectorCompletion(vectors) => {
                Iter::MapVectorCompletion(vectors.vector_completions.iter())
            }
        }
    }
    /// Returns the total number of leaf tasks (vector completions).
    pub fn len(&self) -> usize {
        match self {
            FlatTaskProfile::Function(function) => function.len(),
            FlatTaskProfile::MapFunction(functions) => functions.len(),
            FlatTaskProfile::VectorCompletion(vector) => vector.len(),
            FlatTaskProfile::MapVectorCompletion(vectors) => vectors.len(),
        }
    }

    /// Returns the number of task indices needed for output assembly.
    pub fn task_index_len(&self) -> usize {
        match self {
            FlatTaskProfile::Function(function) => function.task_index_len(),
            FlatTaskProfile::MapFunction(functions) => {
                functions.task_index_len()
            }
            FlatTaskProfile::VectorCompletion(vector) => {
                vector.task_index_len()
            }
            FlatTaskProfile::MapVectorCompletion(vectors) => {
                vectors.task_index_len()
            }
        }
    }
}

/// Multiple function tasks from a mapped expression.
///
/// Created when a task has a `map` index pointing to an input_maps sub-array.
/// Each element in that array produces one function instance.
#[derive(Debug, Clone)]
pub struct MapFunctionFlatTaskProfile {
    /// Path to this task in the Function tree (indices into tasks arrays).
    pub path: Vec<u64>,
    /// The individual flattened function tasks, one per element in the mapped array.
    pub functions: Vec<FunctionFlatTaskProfile>,
    /// Expression to transform the task result from the parent task definition.
    /// Receives: `input` (function input), `output` (the raw FunctionOutput).
    pub task_output: objectiveai::functions::expression::Expression,
    /// Whether to invert the compiled output after applying `task_output`.
    pub invert_output: bool,
}

impl MapFunctionFlatTaskProfile {
    pub fn len(&self) -> usize {
        self.functions
            .iter()
            .map(FunctionFlatTaskProfile::len)
            .sum()
    }

    pub fn task_index_len(&self) -> usize {
        self.functions
            .iter()
            .map(FunctionFlatTaskProfile::task_index_len)
            .sum::<usize>()
            .max(1)
    }
}

/// A flattened function task ready for execution.
///
/// Combines a Function definition with its corresponding Profile. Contains the
/// compiled input, nested tasks with their weights, and the output expression.
#[derive(Debug, Clone)]
pub struct FunctionFlatTaskProfile {
    /// Path to this task in the Function tree (indices into tasks arrays).
    pub path: Vec<u64>,
    /// Full Function ID (owner, repository, commit) if from GitHub.
    pub full_function_id: Option<(String, String, String)>,
    /// Full Profile ID (owner, repository, commit) if from GitHub.
    pub full_profile_id: Option<(String, String, String)>,
    /// Description from the Function definition.
    pub description: Option<String>,
    /// The compiled input for this Function.
    pub input: objectiveai::functions::expression::Input,
    /// The flattened child tasks (None if task was skipped).
    pub tasks: Vec<Option<FlatTaskProfile>>,
    /// The weights for each task from the Profile (for weighted averaging).
    pub profile: Vec<rust_decimal::Decimal>,
    /// The Function type (scalar or vector).
    pub r#type: FunctionType,
    /// Expression to transform the task result from the parent task definition.
    /// Receives: `input` (function input), `output` (the raw FunctionOutput).
    /// None for root-level functions (not called as a task from a parent).
    pub task_output: Option<objectiveai::functions::expression::Expression>,
    /// Whether to invert the compiled output after applying `task_output`.
    ///
    /// Only meaningful when `task_output` is `Some(_)`.
    pub invert_output: bool,
}

impl FunctionFlatTaskProfile {
    pub fn len(&self) -> usize {
        self.tasks
            .iter()
            .map(|task| task.as_ref().map_or(1, |task| task.len()))
            .sum()
    }

    pub fn task_index_len(&self) -> usize {
        let mut len = 0;
        for task in &self.tasks {
            len += if let Some(task) = task {
                task.task_index_len()
            } else {
                1
            };
        }
        len
    }

    pub fn task_indices(&self) -> Vec<u64> {
        let mut indices = Vec::with_capacity(self.tasks.len());
        let mut current_index = 0u64;
        for task in &self.tasks {
            indices.push(current_index);
            current_index += if let Some(task) = task {
                task.task_index_len()
            } else {
                1
            } as u64;
        }
        indices
    }
}

/// The type of a Function's output.
#[derive(Debug, Clone)]
pub enum FunctionType {
    /// Produces a single score in [0, 1].
    Scalar,
    /// Produces a vector of scores that sums to ~1.
    Vector {
        /// Expected output length, if known from output_length expression.
        output_length: Option<u64>,
        /// input_split expression if defined
        input_split: Option<
            objectiveai::functions::expression::WithExpression<
                Vec<objectiveai::functions::expression::Input>,
            >,
        >,
        /// input_merge expression if defined
        input_merge: Option<
            objectiveai::functions::expression::WithExpression<
                objectiveai::functions::expression::Input,
            >,
        >,
    },
}

/// Multiple vector completion tasks from a mapped expression.
///
/// Created when a vector completion task has a `map` index. Each element in the
/// mapped array produces one vector completion instance.
#[derive(Debug, Clone)]
pub struct MapVectorCompletionFlatTaskProfile {
    /// Path to this task in the Function tree (indices into tasks arrays).
    pub path: Vec<u64>,
    /// The individual flattened vector completion tasks.
    pub vector_completions: Vec<VectorCompletionFlatTaskProfile>,
    /// Expression to transform the combined MapVectorCompletion output.
    /// Receives: `input` (function input), `output` (the MapVectorCompletion variant).
    pub task_output: objectiveai::functions::expression::Expression,
    /// Whether to invert the compiled output after applying `task_output`.
    pub invert_output: bool,
}

impl MapVectorCompletionFlatTaskProfile {
    pub fn len(&self) -> usize {
        self.vector_completions.len()
    }

    pub fn task_index_len(&self) -> usize {
        self.vector_completions.len().max(1)
    }
}

/// A flattened vector completion task ready for execution.
///
/// The leaf task type. Contains everything needed to run a vector completion:
/// the Ensemble of LLMs, their weights from the Profile, and the compiled
/// messages/responses.
#[derive(Debug, Clone)]
pub struct VectorCompletionFlatTaskProfile {
    /// Path to this task in the Function tree (indices into tasks arrays).
    pub path: Vec<u64>,
    /// The Ensemble configuration with LLMs and their settings.
    pub ensemble: objectiveai::ensemble::EnsembleBase,
    /// The weights for each LLM in the Ensemble (from the Profile).
    pub profile: Vec<rust_decimal::Decimal>,
    /// The compiled messages for the vector completion.
    pub messages: Vec<objectiveai::chat::completions::request::Message>,
    /// Optional tools for the vector completion (read-only context).
    pub tools: Option<Vec<objectiveai::chat::completions::request::Tool>>,
    /// The compiled response options the LLMs will vote on.
    pub responses: Vec<objectiveai::chat::completions::request::RichContent>,
    /// Expression to transform the raw VectorCompletionOutput into a FunctionOutput.
    /// Receives: `output` (the raw VectorCompletionOutput).
    pub output: objectiveai::functions::expression::Expression,
    /// Whether to invert the compiled output after applying `output`.
    pub invert_output: bool,
}

impl VectorCompletionFlatTaskProfile {
    pub fn len(&self) -> usize {
        1
    }

    pub fn task_index_len(&self) -> usize {
        1
    }
}

/// Parameter for specifying a function source.
#[derive(Debug, Clone)]
pub enum FunctionParam {
    /// Function to fetch from GitHub by owner/repository/commit.
    Remote {
        owner: String,
        repository: String,
        commit: Option<String>,
    },
    /// Already-fetched or inline function definition.
    FetchedOrInline {
        full_id: Option<(String, String, String)>,
        function: objectiveai::functions::Function,
    },
}

/// Parameter for specifying a profile source.
#[derive(Debug, Clone)]
pub enum ProfileParam {
    /// Profile to fetch from GitHub by owner/repository/commit.
    Remote {
        owner: String,
        repository: String,
        commit: Option<String>,
    },
    /// Already-fetched or inline profile definition.
    FetchedOrInline {
        full_id: Option<(String, String, String)>,
        profile: objectiveai::functions::Profile,
    },
}

/// Recursively builds a flattened task from a Function and Profile.
///
/// Fetches any remote Functions/Profiles/Ensembles, compiles task expressions
/// with the input, and validates that the Profile structure matches the Function.
/// The result is a flat tree of tasks ready for parallel execution.
pub async fn get_flat_task_profile<CTXEXT>(
    ctx: ctx::Context<CTXEXT>,
    mut path: Vec<u64>,
    function: FunctionParam,
    profile: ProfileParam,
    input: objectiveai::functions::expression::Input,
    task_output: Option<objectiveai::functions::expression::Expression>,
    invert_output: bool,
    function_fetcher: Arc<
        impl super::function_fetcher::Fetcher<CTXEXT> + Send + Sync + 'static,
    >,
    profile_fetcher: Arc<
        impl super::profile_fetcher::Fetcher<CTXEXT> + Send + Sync + 'static,
    >,
    ensemble_fetcher: Arc<
        crate::ensemble::fetcher::CachingFetcher<
            CTXEXT,
            impl crate::ensemble::fetcher::Fetcher<CTXEXT> + Send + Sync + 'static,
        >,
    >,
) -> Result<super::FunctionFlatTaskProfile, super::executions::Error>
where
    CTXEXT: Send + Sync + 'static,
{
    // fetch function and profile if needed
    let (function_full_id, function, profile_full_id, profile): (
        Option<(String, String, String)>,
        objectiveai::functions::Function,
        Option<(String, String, String)>,
        objectiveai::functions::Profile,
    ) = match (function, profile) {
        (
            FunctionParam::Remote {
                owner: fowner,
                repository: frepository,
                commit: fcommit,
            },
            ProfileParam::Remote {
                owner: powner,
                repository: prepository,
                commit: pcommit,
            },
        ) => {
            let ((function, fcommit), (profile, pcommit)) = tokio::try_join!(
                function_fetcher
                    .fetch(
                        ctx.clone(),
                        &fowner,
                        &frepository,
                        fcommit.as_deref()
                    )
                    .map(|result| match result {
                        Ok(Some(function)) => {
                            Ok((function.inner, function.commit))
                        }
                        Ok(_) =>
                            Err(super::executions::Error::FunctionNotFound),
                        Err(e) =>
                            Err(super::executions::Error::FetchFunction(e)),
                    }),
                profile_fetcher
                    .fetch(
                        ctx.clone(),
                        &powner,
                        &prepository,
                        pcommit.as_deref(),
                    )
                    .map(|result| match result {
                        Ok(Some(profile)) => {
                            Ok((profile.inner, profile.commit))
                        }
                        Ok(_) => Err(super::executions::Error::ProfileNotFound),
                        Err(e) =>
                            Err(super::executions::Error::FetchProfile(e)),
                    }),
            )?;
            (
                Some((fowner.to_owned(), frepository.to_owned(), fcommit)),
                objectiveai::functions::Function::Remote(function),
                Some((powner, prepository, pcommit)),
                objectiveai::functions::Profile::Remote(profile),
            )
        }
        (
            FunctionParam::Remote {
                owner: fowner,
                repository: frepository,
                commit: fcommit,
            },
            ProfileParam::FetchedOrInline {
                full_id: pfull_id,
                profile,
            },
        ) => {
            let (function, fcommit) = match function_fetcher
                .fetch(ctx.clone(), &fowner, &frepository, fcommit.as_deref())
                .await
            {
                Ok(Some(function)) => Ok((function.inner, function.commit)),
                Ok(_) => Err(super::executions::Error::FunctionNotFound),
                Err(e) => Err(super::executions::Error::FetchFunction(e)),
            }?;
            (
                Some((fowner, frepository, fcommit)),
                objectiveai::functions::Function::Remote(function),
                pfull_id,
                profile,
            )
        }
        (
            FunctionParam::FetchedOrInline {
                full_id: ffull_id,
                function,
            },
            ProfileParam::Remote {
                owner: powner,
                repository: prepository,
                commit: pcommit,
            },
        ) => {
            let (profile, pcommit) = match profile_fetcher
                .fetch(ctx.clone(), &powner, &prepository, pcommit.as_deref())
                .await
            {
                Ok(Some(profile)) => Ok((profile.inner, profile.commit)),
                Ok(_) => Err(super::executions::Error::ProfileNotFound),
                Err(e) => Err(super::executions::Error::FetchProfile(e)),
            }?;
            (
                ffull_id,
                function,
                Some((powner, prepository, pcommit)),
                objectiveai::functions::Profile::Remote(profile),
            )
        }
        (
            FunctionParam::FetchedOrInline {
                full_id: ffull_id,
                function,
            },
            ProfileParam::FetchedOrInline {
                full_id: pfull_id,
                profile,
            },
        ) => (ffull_id, function, pfull_id, profile),
    };

    // validate input against input_schema
    if let Some(input_schema) = function.input_schema() {
        if !input_schema.validate_input(&input) {
            return Err(super::executions::Error::InputSchemaMismatch);
        }
    }

    // validate profile tasks length matches function tasks length
    let function_tasks_len = function.tasks().len();
    let profile_tasks_len = match &profile {
        objectiveai::functions::Profile::Remote(rp) => rp.tasks.len(),
        objectiveai::functions::Profile::Inline(ip) => ip.tasks.len(),
    };
    if profile_tasks_len != function_tasks_len {
        return Err(super::executions::Error::InvalidProfile(format!(
            "profile tasks length ({}) does not match function tasks length ({})",
            profile_tasks_len, function_tasks_len
        )));
    }

    // normalize profile into (weight, invert) pairs
    let profile_pairs: Vec<(rust_decimal::Decimal, bool)> = match &profile {
        objectiveai::functions::Profile::Remote(rp) => {
            rp.profile.to_weights_and_invert()
        }
        objectiveai::functions::Profile::Inline(ip) => {
            ip.profile.to_weights_and_invert()
        }
    };

    // validate profile weights length matches function tasks length
    if profile_pairs.len() != function_tasks_len {
        return Err(super::executions::Error::InvalidProfile(format!(
            "profile weights length ({}) does not match function tasks length ({})",
            profile_pairs.len(),
            function_tasks_len
        )));
    }

    // split into weights and invert flags
    let (profile_weights, profile_invert_flags): (
        Vec<rust_decimal::Decimal>,
        Vec<bool>,
    ) = profile_pairs.into_iter().unzip();

    // take description
    let description = function.description().map(str::to_owned);

    // take type, compile output_length if needed
    let r#type = match function {
        objectiveai::functions::Function::Remote(
            objectiveai::functions::RemoteFunction::Scalar { .. },
        ) => FunctionType::Scalar,
        objectiveai::functions::Function::Remote(
            objectiveai::functions::RemoteFunction::Vector {
                ref output_length,
                ref input_split,
                ref input_merge,
                ..
            },
        ) => {
            let params = objectiveai::functions::expression::Params::Ref(
                objectiveai::functions::expression::ParamsRef {
                    input: &input,
                    output: None,
                    map: None,
                },
            );
            FunctionType::Vector {
                output_length: Some(
                    output_length.clone().compile_one(&params)?,
                ),
                input_split: Some(input_split.clone()),
                input_merge: Some(input_merge.clone()),
            }
        }
        objectiveai::functions::Function::Inline(
            objectiveai::functions::InlineFunction::Scalar { .. },
        ) => FunctionType::Scalar,
        objectiveai::functions::Function::Inline(
            objectiveai::functions::InlineFunction::Vector {
                ref input_split,
                ref input_merge,
                ..
            },
        ) => FunctionType::Vector {
            output_length: None,
            input_split: input_split.clone(),
            input_merge: input_merge.clone(),
        },
    };

    // compile function tasks
    let tasks = function.compile_tasks(&input)?;

    // initialize flat tasks / futs vector
    let mut flat_tasks_or_futs = Vec::with_capacity(tasks.len());

    // iterate through tasks
    for (i, (task, profile)) in tasks
        .into_iter()
        .zip(match profile {
            objectiveai::functions::Profile::Remote(rp) => {
                either::Either::Left(rp.tasks.into_iter())
            }
            objectiveai::functions::Profile::Inline(ip) => {
                either::Either::Right(ip.tasks.into_iter())
            }
        })
        .enumerate()
    {
        // if skip, push None to flat tasks
        let task = match task {
            Some(task) => task,
            None => {
                flat_tasks_or_futs.push(TaskFut::SkipTask);
                continue;
            }
        };

        // task path
        let task_path = {
            path.push(i as u64);
            let p = path.clone();
            path.pop();
            p
        };

        // switch by task type
        match task {
            objectiveai::functions::CompiledTask::One(
                objectiveai::functions::Task::ScalarFunction(
                    objectiveai::functions::ScalarFunctionTask {
                        owner,
                        repository,
                        commit,
                        input,
                        output,
                    },
                ),
            )
            | objectiveai::functions::CompiledTask::One(
                objectiveai::functions::Task::VectorFunction(
                    objectiveai::functions::VectorFunctionTask {
                        owner,
                        repository,
                        commit,
                        input,
                        output,
                    },
                ),
            ) => {
                let effective_invert_output = profile_invert_flags[i];
                flat_tasks_or_futs.push(TaskFut::FunctionTaskFut(Box::pin(
                    get_flat_task_profile(
                        ctx.clone(),
                        task_path,
                        FunctionParam::Remote {
                            owner,
                            repository,
                            commit: Some(commit),
                        },
                        match profile {
                            objectiveai::functions::TaskProfile::RemoteFunction {
                                owner,
                                repository,
                                commit,
                            } => ProfileParam::Remote {
                                owner,
                                repository,
                                commit,
                            },
                            objectiveai::functions::TaskProfile::InlineFunction(
                                profile,
                            ) => ProfileParam::FetchedOrInline {
                                full_id: None,
                                profile: objectiveai::functions::Profile::Inline(
                                    profile,
                                ),
                            },
                            _ => return Err(super::executions::Error::InvalidProfile(
                                "expected function profile (RemoteFunction or InlineFunction) for function task".to_string()
                            )),
                        },
                        input,
                        Some(output),
                        effective_invert_output,
                        function_fetcher.clone(),
                        profile_fetcher.clone(),
                        ensemble_fetcher.clone(),
                    )
                )));
            }
            objectiveai::functions::CompiledTask::One(
                objectiveai::functions::Task::VectorCompletion(task),
            ) => {
                let (ensemble, profile) = match profile {
                    objectiveai::functions::TaskProfile::VectorCompletion {
                        ensemble,
                        profile,
                    } => (ensemble, profile),
                    _ => return Err(super::executions::Error::InvalidProfile(
                        "expected VectorCompletion profile for vector completion task".to_string()
                    )),
                };
                let effective_invert_output = profile_invert_flags[i];
                flat_tasks_or_futs.push(TaskFut::VectorTaskFut(Box::pin(
                    get_vector_completion_flat_task_profile(
                        ctx.clone(),
                        task_path,
                        task,
                        ensemble,
                        profile,
                        effective_invert_output,
                        ensemble_fetcher.clone(),
                    ),
                )));
            }
            objectiveai::functions::CompiledTask::Many(tasks) => {
                // Determine task type and extract shared output expression before consuming tasks
                let (is_vector_completion, map_task_output) = match tasks
                    .first()
                {
                    Some(objectiveai::functions::Task::VectorCompletion(
                        vc,
                    )) => (true, vc.output.clone()),
                    Some(objectiveai::functions::Task::ScalarFunction(sf)) => {
                        (false, sf.output.clone())
                    }
                    Some(objectiveai::functions::Task::VectorFunction(vf)) => {
                        (false, vf.output.clone())
                    }
                    None => {
                        // Empty mapped task - need a placeholder expression
                        // This case shouldn't normally happen, but handle gracefully
                        (true, objectiveai::functions::expression::Expression::JMESPath(
                            "output".to_string()
                        ))
                    }
                };

                if is_vector_completion {
                    let map_invert_output = profile_invert_flags[i];
                    let mut futs = Vec::with_capacity(tasks.len());
                    for (j, task) in tasks.into_iter().enumerate() {
                        let mut task_path = task_path.clone();
                        task_path.push(j as u64);
                        let (ensemble, profile) = match &profile {
                            objectiveai::functions::TaskProfile::VectorCompletion {
                                ensemble,
                                profile,
                            } => (ensemble.clone(), profile.clone()),
                            _ => return Err(super::executions::Error::InvalidProfile(
                                "expected VectorCompletion profile for mapped vector completion task".to_string()
                            )),
                        };
                        futs.push(get_vector_completion_flat_task_profile(
                            ctx.clone(),
                            task_path,
                            match task {
                                objectiveai::functions::Task::VectorCompletion(
                                    vc_task,
                                ) => vc_task,
                                _ => unreachable!(),
                            },
                            ensemble,
                            profile,
                            map_invert_output,
                            ensemble_fetcher.clone(),
                        ));
                    }
                    flat_tasks_or_futs.push(TaskFut::MapVectorTaskFut((
                        task_path,
                        map_task_output,
                        map_invert_output,
                        futures::future::try_join_all(futs),
                    )));
                } else {
                    let map_invert_output = profile_invert_flags[i];
                    let mut futs = Vec::with_capacity(tasks.len());
                    for (j, task) in tasks.into_iter().enumerate() {
                        let mut task_path = task_path.clone();
                        task_path.push(j as u64);
                        futs.push(get_flat_task_profile(
                            ctx.clone(),
                            task_path,
                            FunctionParam::Remote {
                                owner: match &task {
                                    objectiveai::functions::Task::ScalarFunction(
                                        sf_task,
                                    ) => sf_task.owner.clone(),
                                    objectiveai::functions::Task::VectorFunction(
                                        vf_task,
                                    ) => vf_task.owner.clone(),
                                    _ => unreachable!(),
                                },
                                repository: match &task {
                                    objectiveai::functions::Task::ScalarFunction(
                                        sf_task,
                                    ) => sf_task.repository.clone(),
                                    objectiveai::functions::Task::VectorFunction(
                                        vf_task,
                                    ) => vf_task.repository.clone(),
                                    _ => unreachable!(),
                                },
                                commit: Some(match &task {
                                    objectiveai::functions::Task::ScalarFunction(
                                        sf_task,
                                    ) => sf_task.commit.clone(),
                                    objectiveai::functions::Task::VectorFunction(
                                        vf_task,
                                    ) => vf_task.commit.clone(),
                                    _ => unreachable!(),
                                }),
                            },
                            match &profile {
                                objectiveai::functions::TaskProfile::RemoteFunction {
                                    owner,
                                    repository,
                                    commit,
                                } => ProfileParam::Remote {
                                    owner: owner.clone(),
                                    repository: repository.clone(),
                                    commit: commit.clone(),
                                },
                                objectiveai::functions::TaskProfile::InlineFunction(
                                    profile,
                                ) => ProfileParam::FetchedOrInline {
                                    full_id: None,
                                    profile: objectiveai::functions::Profile::Inline(
                                        profile.clone(),
                                    ),
                                },
                                _ => return Err(super::executions::Error::InvalidProfile(
                                    "expected function profile (RemoteFunction or InlineFunction) for mapped function task".to_string()
                                )),
                            },
                            match &task {
                                objectiveai::functions::Task::ScalarFunction(
                                    sf_task,
                                ) => sf_task.input.clone(),
                                objectiveai::functions::Task::VectorFunction(
                                    vf_task,
                                ) => vf_task.input.clone(),
                                _ => unreachable!(),
                            },
                            // Pass None for individual mapped functions - the task_output is stored on MapFunctionFlatTaskProfile
                            None,
                            false,
                            function_fetcher.clone(),
                            profile_fetcher.clone(),
                            ensemble_fetcher.clone(),
                        ));
                    }
                    flat_tasks_or_futs.push(TaskFut::MapFunctionTaskFut((
                        task_path,
                        map_task_output,
                        map_invert_output,
                        futures::future::try_join_all(futs),
                    )));
                }
            }
        }
    }

    // await all futs
    let tasks = futures::future::try_join_all(flat_tasks_or_futs).await?;

    // return flat function task
    Ok(super::FunctionFlatTaskProfile {
        path,
        description,
        full_function_id: function_full_id,
        full_profile_id: profile_full_id,
        input,
        tasks,
        profile: profile_weights,
        r#type,
        task_output,
        invert_output,
    })
}

async fn get_vector_completion_flat_task_profile<CTXEXT>(
    ctx: ctx::Context<CTXEXT>,
    path: Vec<u64>,
    task: objectiveai::functions::VectorCompletionTask,
    ensemble: objectiveai::vector::completions::request::Ensemble,
    profile: objectiveai::vector::completions::request::Profile,
    invert_output: bool,
    ensemble_fetcher: Arc<
        crate::ensemble::fetcher::CachingFetcher<
            CTXEXT,
            impl crate::ensemble::fetcher::Fetcher<CTXEXT> + Send + Sync + 'static,
        >,
    >,
) -> Result<super::VectorCompletionFlatTaskProfile, super::executions::Error>
where
    CTXEXT: Send + Sync + 'static,
{
    // switch based on profile
    let ensemble = match ensemble {
        objectiveai::vector::completions::request::Ensemble::Id(id) => {
            // fetch ensemble
            ensemble_fetcher
                .fetch(ctx, &id)
                .map(|result| match result {
                    Ok(Some((ensemble, _))) => Ok(ensemble),
                    Ok(None) => Err(super::executions::Error::EnsembleNotFound),
                    Err(e) => Err(super::executions::Error::FetchEnsemble(e)),
                })
                .await?
        }
        objectiveai::vector::completions::request::Ensemble::Provided(
            ensemble,
        ) => {
            // validate ensemble
            ensemble
                .clone()
                .try_into()
                .map_err(super::executions::Error::InvalidEnsemble)?
        }
    };

    // normalize profile into (weight, invert) pairs and validate length
    let profile_pairs = profile.to_weights_and_invert();
    if profile_pairs.len() != ensemble.llms.len() {
        return Err(super::executions::Error::InvalidProfile(format!(
            "vector completion profile weights length ({}) does not match ensemble LLMs length ({})",
            profile_pairs.len(),
            ensemble.llms.len()
        )));
    }

    let profile: Vec<rust_decimal::Decimal> =
        profile_pairs.into_iter().map(|(w, _)| w).collect();

    // construct flat task profile
    Ok(super::VectorCompletionFlatTaskProfile {
        path,
        ensemble: objectiveai::ensemble::EnsembleBase {
            llms: ensemble
                .llms
                .into_iter()
                .map(|llm| {
                    objectiveai::ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount {
                        count: llm.count,
                        inner: llm.inner.base,
                        fallbacks: llm.fallbacks.map(|fallbacks| {
                            fallbacks
                                .into_iter()
                                .map(|fallback| fallback.base)
                                .collect()
                        }),
                    }
                })
                .collect(),
        },
        profile,
        messages: task.messages,
        tools: task.tools,
        responses: task.responses,
        output: task.output,
        invert_output,
    })
}

enum TaskFut<
    VFUT: Future<
        Output = Result<
            super::VectorCompletionFlatTaskProfile,
            super::executions::Error,
        >,
    >,
    FFUT: Future<
        Output = Result<
            super::FunctionFlatTaskProfile,
            super::executions::Error,
        >,
    >,
> {
    SkipTask,
    Task(Option<super::FlatTaskProfile>),
    VectorTaskFut(Pin<Box<VFUT>>),
    MapVectorTaskFut(
        (
            Vec<u64>,
            objectiveai::functions::expression::Expression,
            bool,
            futures::future::TryJoinAll<VFUT>,
        ),
    ),
    FunctionTaskFut(Pin<Box<FFUT>>),
    MapFunctionTaskFut(
        (
            Vec<u64>,
            objectiveai::functions::expression::Expression,
            bool,
            futures::future::TryJoinAll<FFUT>,
        ),
    ),
}

impl<VFUT, FFUT> Future for TaskFut<VFUT, FFUT>
where
    VFUT: Future<
        Output = Result<
            super::VectorCompletionFlatTaskProfile,
            super::executions::Error,
        >,
    >,
    FFUT: Future<
        Output = Result<
            super::FunctionFlatTaskProfile,
            super::executions::Error,
        >,
    >,
{
    type Output =
        Result<Option<super::FlatTaskProfile>, super::executions::Error>;
    fn poll(
        self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> Poll<Self::Output> {
        match self.get_mut() {
            TaskFut::SkipTask => Poll::Ready(Ok(None)),
            TaskFut::Task(task) => Poll::Ready(Ok(task.take())),
            TaskFut::VectorTaskFut(fut) => Pin::new(fut)
                .poll(cx)
                .map_ok(FlatTaskProfile::VectorCompletion)
                .map_ok(Some),
            TaskFut::MapVectorTaskFut((path, task_output, invert_output, futs)) => {
                Pin::new(futs).poll(cx).map_ok(|results| {
                    Some(FlatTaskProfile::MapVectorCompletion(
                        MapVectorCompletionFlatTaskProfile {
                            path: path.clone(),
                            vector_completions: results,
                            task_output: task_output.clone(),
                            invert_output: *invert_output,
                        },
                    ))
                })
            }
            TaskFut::FunctionTaskFut(fut) => Pin::new(fut)
                .poll(cx)
                .map_ok(FlatTaskProfile::Function)
                .map_ok(Some),
            TaskFut::MapFunctionTaskFut((path, task_output, invert_output, futs)) => {
                Pin::new(futs).poll(cx).map_ok(|results| {
                    Some(FlatTaskProfile::MapFunction(
                        MapFunctionFlatTaskProfile {
                            path: path.clone(),
                            functions: results,
                            task_output: task_output.clone(),
                            invert_output: *invert_output,
                        },
                    ))
                })
            }
        }
    }
}
