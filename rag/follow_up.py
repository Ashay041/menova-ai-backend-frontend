import chainlit as cl
import asyncio


## TODO
async def send_follow_up():
    """Background task that checks if users need follow-ups."""
    while True:
        await asyncio.sleep(3600)  # Run every hour

        user_files = [f for f in os.listdir("user_memories") if f.endswith("_progress.json")]

        for user_file in user_files:
            user_id = user_file.replace("_progress.json", "")

            if progress_tracker.check_for_follow_up(user_id):
                follow_up_message = progress_tracker.generate_progress_summary(user_id)

                await cl.Message(
                    content=follow_up_message,
                    author="MenopauseBot"
                ).send()

                # Update next follow-up schedule
                progress_tracker.update_progress(user_id, "")
