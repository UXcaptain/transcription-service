# Technical Specification: AWS Transcribe Output Normalization

## 1. Overview

This document specifies the design for normalizing AWS Transcribe output to a standardized format that can be used by the transcription service. The normalization function will be implemented in `utils/transcriptionJobDataNormalizer.js`.

## 2. Input Format (AWS Transcribe Output)

Based on standard AWS Transcribe JSON output format, the input will have the following structure:

```json
{
  "jobName": "transcription-job-name",
  "accountId": "account-id",
  "status": "COMPLETED",
  "results": {
    "transcripts": [
      {
        "transcript": "Full transcript text here..."
      }
    ],
    "items": [
      {
        "start_time": "0.0",
        "end_time": "0.5",
        "type": "pronunciation",
        "alternatives": [
          {
            "confidence": "1.0",
            "content": "Hello"
          }
        ]
      },
      {
        "type": "punctuation",
        "alternatives": [
          {
            "confidence": "1.0",
            "content": "."
          }
        ]
      }
    ]
  }
}
```

## 3. Output Format

The normalized output should have the following structure:

```json
{
  "status": "COMPLETED",
  "results": {
    "segments": [
      {
        "start_time": 0.0,
        "end_time": 5.5,
        "transcript": "Hello world."
      },
      {
        "start_time": 10.0,
        "end_time": 11.5,
        "transcript": "This is an example of transcript - it could be anything the user speaks."
      },
      {
        "start_time": 22.0,
        "end_time": 25.5,
        "transcript": "This is an example of transcript - it could be anything the user speaks."
      },
      {
        "start_time": 32.0,
        "end_time": 33.5,
        "transcript": "This is an example of transcript - it could be anything the user speaks."
      }
    ],
    
  }
}
```
