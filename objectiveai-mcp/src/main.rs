use rmcp::{
    ServerHandler,
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::{ServerCapabilities, ServerInfo},
    schemars, tool, tool_handler, tool_router,
    transport::stdio,
    ServiceExt,
};

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct HelloRequest {
    #[schemars(description = "Name to greet")]
    name: String,
}

#[derive(Debug, Clone)]
struct ObjectiveAiMcp {
    tool_router: ToolRouter<Self>,
}

#[tool_router]
impl ObjectiveAiMcp {
    fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
        }
    }

    #[tool(description = "Say hello to someone")]
    fn hello(&self, Parameters(HelloRequest { name }): Parameters<HelloRequest>) -> String {
        format!("Hello, {name}! Welcome to ObjectiveAI.")
    }
}

#[tool_handler]
impl ServerHandler for ObjectiveAiMcp {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            instructions: Some("ObjectiveAI MCP server".into()),
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            ..Default::default()
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::DEBUG.into()),
        )
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .init();

    tracing::info!("Starting ObjectiveAI MCP server");

    let service = ObjectiveAiMcp::new()
        .serve(stdio())
        .await
        .inspect_err(|e| {
            tracing::error!("serving error: {:?}", e);
        })?;

    service.waiting().await?;
    Ok(())
}
