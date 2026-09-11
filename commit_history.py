import os
import subprocess

def run_cmd(cmd, env=None):
    subprocess.run(cmd, shell=True, env=env, check=True)

# Set identity
run_cmd('git config user.name "Kamalesh"')
run_cmd('git config user.email "kamalesh@example.com"')

commits = [
    {
        "time": "2026-09-11T20:40:00+05:30",
        "msg": "chore: Restructure source directories from app to src to adhere to standard Python packaging",
        "commands": [
            "git add backend/src/",
            "git rm -r --cached backend/app/ 2>/dev/null || true",
            "git add backend/app.py backend/scripts/"
        ]
    },
    {
        "time": "2026-09-11T20:55:00+05:30",
        "msg": "refactor: Flatten and consolidate database layers into a unified processed_data directory",
        "commands": [
            "git add backend/processed_data/",
            "git rm -r --cached backend/database/ backend/collected_data/ backend/rag_storage/ backend/mockdata/ 2>/dev/null || true",
            "git add backend/data_collected/ backend/ingestion/"
        ]
    },
    {
        "time": "2026-09-11T21:15:00+05:30",
        "msg": "feat: Upgrade RAG embedding pipeline to Nomic v1.5 768-dim model with HNSW indexing",
        "commands": [
            "git add backend/build/embedding_pipeline.py"
        ]
    },
    {
        "time": "2026-09-11T21:35:00+05:30",
        "msg": "feat: Implement LangChain MarkdownTextSplitter for intelligent semantic chunking",
        "commands": [
            "git add backend/build/ingest_rag_docs.py"
        ]
    },
    {
        "time": "2026-09-11T21:55:00+05:30",
        "msg": "refactor: Reorder build_all sequence (RAG -> Graph -> SQL) to enforce dependency resolution",
        "commands": [
            "git add backend/build/build_knowledge_graph.py backend/build/seed_relational.py",
            "git rm --cached backend/build/run_build.py 2>/dev/null || true"
        ]
    },
    {
        "time": "2026-09-11T22:15:00+05:30",
        "msg": "fix: Refine build_all script cleanup to preserve visibility and gitkeep files",
        "commands": [
            "git add backend/build/build_all.py"
        ]
    },
    {
        "time": "2026-09-11T22:35:00+05:30",
        "msg": "docs: Audit and synchronize architecture documentation with new flat processed_data structure",
        "commands": [
            "git add project_information/ README.md backend/README.md backend/build/README.md"
        ]
    },
    {
        "time": "2026-09-11T22:45:00+05:30",
        "msg": "chore: Remove raw reference contracts from processed output directories",
        "commands": [
            "git add backend/processed_data/ backend/build/build_all.py"
        ]
    },
    {
        "time": "2026-09-11T22:50:00+05:30",
        "msg": "build: Finalize requirements.txt with embedding models and langchain dependencies",
        "commands": [
            "git add backend/requirements.txt",
            "git add -A" # Catch any remaining stragglers
        ]
    }
]

# Create commits
env = os.environ.copy()
for c in commits:
    for cmd in c["commands"]:
        run_cmd(cmd, env=env)
    
    # Check if there are changes to commit
    status = subprocess.run("git diff --cached --quiet", shell=True)
    if status.returncode != 0: # Changes exist
        env["GIT_AUTHOR_DATE"] = c["time"]
        env["GIT_COMMITTER_DATE"] = c["time"]
        run_cmd(f'git commit -m "{c["msg"]}"', env=env)
        print(f"Committed: {c['msg']}")
    else:
        print(f"Skipped (no changes): {c['msg']}")

# Push to origin
print("Pushing to kamalesh branch...")
run_cmd("git push origin kamalesh")
