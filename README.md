# MeetMind

> A full-stack AI meeting assistant for real-time transcription, meeting summarization, decision extraction, and action-item generation.

**[Live Demo](https://madhurima7284.github.io/meetmind/)** · **[GitHub Repository](https://github.com/madhurima7284/meetmind)**

## Overview

MeetMind is an AI-powered meeting assistant that captures meeting audio, generates real-time transcriptions, and converts meeting conversations into structured and actionable information.

The application uses WebSockets for real-time audio streaming, Whisper for speech-to-text transcription, and Google Gemini for extracting meeting summaries, key decisions, and action items.

## Features

* Real-time microphone audio capture
* Real-time speech transcription
* WebSocket-based audio streaming
* Whisper-powered speech-to-text
* LLM-powered meeting analysis
* Automatic meeting summaries
* Key decision extraction
* Action-item extraction
* Action-item owners and deadlines
* Meeting data persistence
* PostgreSQL and SQLite support

## Architecture

```text
                    Browser
                       |
                       | Microphone Audio
                       v
              React Meeting Interface
                       |
                       | WebSocket
                       v
                  Backend Server
                  /            \
                 /              \
                v                v
         Whisper ASR          Database
                |           PostgreSQL /
                |             SQLite
                v
        Real-Time Transcript
                |
                | Meeting Ends
                v
            Gemini LLM
                |
                v
       Structured Meeting Data
          /        |        \
         /         |         \
        v          v          v
    Summary    Decisions   Action Items
                              |
                         Owner + Deadline
```

## Real-Time Transcription

MeetMind captures microphone audio using the browser's `MediaRecorder` API and sends audio chunks to the backend through a WebSocket connection.

The backend processes the audio using Whisper and returns transcript segments to the frontend in real time.

```text
Microphone
    |
MediaRecorder
    |
Audio Chunks
    |
WebSocket
    |
Whisper
    |
Transcript
    |
React Interface
```

## AI Meeting Analysis

Once a meeting ends, the complete transcript is processed using Google Gemini.

The model converts the raw transcript into structured meeting information:

### Executive Summary

A concise summary of the main topics discussed during the meeting.

### Key Decisions

Important decisions identified from the conversation.

### Action Items

Tasks extracted from the meeting, including:

* Task description
* Responsible person
* Deadline

This transforms an unstructured meeting transcript into information th
