"""
Milestone 1: Audio File -> Transcript
-------------------------------------
This script loads an audio file ('meeting.mp3'), passes it to OpenAI Whisper 
to recognize spoken words, prints the transcript to the console, and 
saves the resulting text into 'transcript.txt'.

What is Whisper?
- OpenAI Whisper is an open-source Automatic Speech Recognition (ASR) model developed by OpenAI.
- It was trained on 680,000 hours of multilingual audio data.
- It converts spoken audio directly into written text.
"""

import os
import whisper

def main():
    # -------------------------------------------------------------------
    # Step 1: Define the path to the input audio file
    # -------------------------------------------------------------------
    audio_file_path = "meeting.mp3"
    
    # Check if the audio file exists before attempting to load it
    if not os.path.exists(audio_file_path):
        print(f"Error: File '{audio_file_path}' not found in the current directory.")
        print("Please place a 'meeting.mp3' file in the backend/ directory.")
        return

    print("==================================================")
    print("      Real-Time Meeting Assistant - Milestone 1   ")
    print("==================================================")
    
    # -------------------------------------------------------------------
    # Step 2: Load the Whisper model
    #
    # What is the 'base' model?
    # - Whisper provides several model sizes: tiny, base, small, medium, large.
    # - 'base' uses ~140MB of memory and balances fast speed with good accuracy.
    # - load_model("base") downloads and loads the pre-trained neural network weights.
    # -------------------------------------------------------------------
    print("1. Loading OpenAI Whisper ('base' model)...")
    model = whisper.load_model("base")
    print("   Model loaded successfully!")

    # -------------------------------------------------------------------
    # Step 3: Transcribe the audio file
    #
    # What does model.transcribe() do?
    # - Reads the audio file (using FFmpeg behind the scenes).
    # - Converts the audio into a mathematical representation (log-Mel spectrogram).
    # - Feeds the audio features through the Transformer neural network.
    # - Decodes the acoustic features into written text words.
    # -------------------------------------------------------------------
    print(f"2. Transcribing '{audio_file_path}'... Please wait.")
    result = model.transcribe(audio_file_path)

    # -------------------------------------------------------------------
    # Step 4: Extract the transcript text from the result dictionary
    #
    # What does the returned result contain?
    # - result["text"]: A single string containing the entire transcript.
    # - result["segments"]: A list of detail objects (start time, end time, text).
    # - result["language"]: The language code auto-detected from the audio (e.g., 'en').
    # -------------------------------------------------------------------
    transcript_text = result["text"].strip()
    detected_language = result.get("language", "en")

    print("\n--------------------------------------------------")
    print(f"Detected Language: {detected_language}")
    print("Transcript Preview:")
    print("--------------------------------------------------")
    print(transcript_text)
    print("--------------------------------------------------\n")

    # -------------------------------------------------------------------
    # Step 5: Save the transcript string to 'transcript.txt'
    # -------------------------------------------------------------------
    output_file_path = "transcript.txt"
    with open(output_file_path, "w", encoding="utf-8") as f:
        f.write(transcript_text)

    print(f"3. Saved transcript successfully to '{output_file_path}'.")

if __name__ == "__main__":
    main()
