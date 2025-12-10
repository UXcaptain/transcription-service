/**
 * Converts string numbers to actual numbers
 * @param {string|number} value - Value to convert
 * @returns {number} Converted number or 0 if invalid
 */
const convertToNumber = (value) => {
  if (value === undefined || value === null) {
    return 0;
  }

  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
};

/**
 * Groups transcription items into logical segments
 * @param {Array} items - Array of transcription items from AWS Transcribe
 * @returns {Array} Array of segments with start_time, end_time, and transcript
 */
const createSegmentsFromItems = (items) => {
  if (!items || items.length === 0) {
    return [];
  }

  const segments = [];
  let currentSegment = null;
  const SEGMENT_GAP_THRESHOLD = 2.0; // seconds - gap between words to start new segment

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    // Skip items without alternatives
    if (!item.alternatives || item.alternatives.length === 0) {
      // Skip this iteration
    } else {
      const alternative = item.alternatives[0];
      const content = alternative.content || '';

      // Handle items without timing information (like some punctuation)
      if (!item.start_time || !item.end_time) {
        if (currentSegment && item.type === 'punctuation') {
          currentSegment.transcript += content;
        }
      } else {
        const startTime = convertToNumber(item.start_time);
        const endTime = convertToNumber(item.end_time);

        // Start a new segment or continue current segment
        if (!currentSegment) {
          // Start first segment
          currentSegment = {
            start_time: startTime,
            end_time: endTime,
            transcript: content,
          };
        } else {
          // Check if we should start a new segment based on time gap
          const timeGap = startTime - currentSegment.end_time;

          if (timeGap > SEGMENT_GAP_THRESHOLD) {
            // Significant gap - finalize current segment and start new one
            segments.push(currentSegment);
            currentSegment = {
              start_time: startTime,
              end_time: endTime,
              transcript: content,
            };
          } else {
            // Continue current segment
            // Add space before content if current segment doesn't end with punctuation
            if (!currentSegment.transcript.match(/[.,!?;:]$/)) {
              currentSegment.transcript += ' ';
            }
            currentSegment.transcript += content;
            currentSegment.end_time = endTime;
          }
        }
      }
    }
  }

  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
};

/**
 * Normalizes AWS Transcribe output to the required format
 * @param {string|object} transcript - AWS Transcribe output as JSON string or parsed object
 * @returns {Promise<object>} Normalized transcription data
 */
export const normalizeTranscript = async (transcript) => {
  try {
    // Parse the input if it's a string
    let parsedTranscript;
    if (typeof transcript === 'string') {
      parsedTranscript = JSON.parse(transcript);
    } else {
      parsedTranscript = transcript;
    }

    // Handle missing or malformed data
    if (!parsedTranscript) {
      return {
        status: 'FAILED',
        results: {
          transcripts: [],
          segments: [],
        },
      };
    }

    // Extract status
    const status = parsedTranscript.status || 'UNKNOWN';

    // Extract results section
    const results = parsedTranscript.results || {};

    // Extract transcripts array (pass through unchanged)
    const transcripts = results.transcripts || [];

    // Extract items array and create segments
    const items = results.items || [];
    const segments = createSegmentsFromItems(items);

    // Return normalized structure matching the required format
    return {
      status,
      results: {
        transcripts,
        segments,
      },
    };
  } catch (error) {
    console.error('Error normalizing transcript:', error);
    return {
      status: 'FAILED',
      results: {
        transcripts: [],
        segments: [],
      },
    };
  }
};
