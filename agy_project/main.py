"""Main entry point for running the example AGY flow."""

import asyncio

from objects.example_context import ExampleContext

from agy import Flow, FlowExecutor


async def main():
    """Execute the example flow."""
    # Load the flow
    flow = Flow.from_flowsy("example_flow.flowsy")

    # Create context object
    context_obj = ExampleContext(text="This is a great example of AGY in action!")

    # Create executor with context_in
    executor = FlowExecutor(context_in={"context": context_obj})

    # Execute the flow
    result_context = await executor.execute(flow)

    # Print results
    print("\n=== Flow Execution Results ===")
    print(f"Success: {result_context.get('success', False)}")
    print(f"Category: {result_context.get('category', 'N/A')}")
    print(f"Confidence: {result_context.get('confidence', 'N/A')}")

    if result_context.get("error_msg"):
        print(f"Error: {result_context.get('error_msg')}")

    # Show processing log
    print(f"\nProcessing Log:\n{context_obj.get_summary()}")


if __name__ == "__main__":
    asyncio.run(main())
