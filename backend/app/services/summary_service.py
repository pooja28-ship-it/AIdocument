import os

from openai import OpenAI

from app.services.text_service import split_text

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"]
)

def generate_summary(
    text: str,
    summary_type: str = "brief",
) -> str:

    instructions = {
        "brief": (
            "Create a concise summary in a few sentences. "
            "Focus only on the most important information."
        ),
        "detailed": (
            "Create a detailed summary covering the main ideas, "
            "important facts, explanations, and conclusions."
        ),
        "key_points": (
            "Extract the most important points from the document. "
            "Present them as clear bullet points."
        ),
    }

    if summary_type not in instructions:
        raise ValueError("Invalid summary type")

    response = client.responses.create(
        model="gpt-5-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You are a document summarization assistant. "
                    "Do not invent information that is not present "
                    "in the document. "
                    + instructions[summary_type]
                ),
            },
            {
                "role": "user",
                "content": text,
            },
        ],
    )

    return response.output_text


# map reduce style summary appraoch
def generate_long_summary(
    text: str,
    summary_type: str = "brief",
) -> str:

    chunks = split_text(text)

    if not chunks:
        raise ValueError("Document contains no text")

    chunk_summaries = []

    for chunk in chunks:
        summary = generate_summary(
            chunk,
            summary_type,
        )

        chunk_summaries.append(summary)

    combined_text = "\n\n".join(chunk_summaries)

    if len(chunk_summaries) == 1:
        return chunk_summaries[0]

    return generate_summary(
        combined_text,
        summary_type,
    )