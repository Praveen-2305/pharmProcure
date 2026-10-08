import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from src.agents.workflow import create_procurement_workflow
from src.agents.state import WorkflowState, ProcurementRequest

# 1. Compile graph
print("Compiling Workflow...")
app = create_procurement_workflow()

# 2. Setup mock request
request = ProcurementRequest(
    procurement_id="REQ-TEST-100",
    vendor_name="Acme Medical Supplies",
    category="Pharmaceuticals",
    deal_size=550000.0,
    procurement_details="Supply of generic paracetamol",
    quoted_unit_price=1.20
)

state = WorkflowState(
    request=request,
    stage="PLANNING"
)

print("\n--- Running Pipeline ---")
try:
    for event in app.stream(state):
        for key, value in event.items():
            print(f"Node Executed: {key}")
            # Just print the stage to keep it brief
            if "stage" in value:
                print(f"  Stage: {value['stage']}")
            if "investigation_plan" in value:
                print(f"  Plan: {value['investigation_plan']}")
    print("Pipeline Execution Successful!")
except Exception as e:
    print(f"Pipeline Failed: {e}")
