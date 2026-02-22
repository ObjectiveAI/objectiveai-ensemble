# ObjectiveAI Scripts

Utility scripts for ObjectiveAI development and operations.

## Scripts

### `compute-function-count.sh`

Computes the total number of functions the CLI (`objectiveai-cli`) will generate for a given width and depth.

**Usage:**
```bash
./compute-function-count.sh <width> <depth>
```

**Examples:**
```bash
./compute-function-count.sh 3 2   # => 13 (1 root + 3 children + 9 grandchildren)
./compute-function-count.sh 20 1  # => 21 (1 root + 20 children)
./compute-function-count.sh 5 0   # => 1  (root only, no sub-functions)
```
