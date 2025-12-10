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
 * Formats a number with comma as decimal separator (Spanish locale)
 * @param {number} value - Value to format
 * @returns {string} Formatted value with comma as decimal separator
 */
const formatWithComma = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  // Format number with 3 decimal places and replace dot with comma for Spanish locale
  return value.toFixed(3).replace('.', ',');
};

/**
 * Creates words array for a segment from items
 * @param {Array} items - Array of transcription items
 * @param {Array} segmentItemIndices - Indices of items in this segment
 * @returns {Array} Array of words for the segment
 */
const createWordsForSegment = (items, segmentItemIndices) => {
  const words = [];

  // Using traditional for loop instead of for...of to comply with ESLint rules
  for (let i = 0; i < segmentItemIndices.length; i += 1) {
    const itemIndex = segmentItemIndices[i];
    const item = items[itemIndex];

    if (item.alternatives && item.alternatives.length > 0) {
      const alternative = item.alternatives[0];

      // Handle punctuation items which may not have timing information
      const isPunctuation = item.type === 'punctuation';

      // Determine start time
      let startTime = null;
      if (!isPunctuation && item.start_time) {
        startTime = formatWithComma(convertToNumber(item.start_time));
      }

      // Determine end time
      let endTime = null;
      if (!isPunctuation && item.end_time) {
        endTime = formatWithComma(convertToNumber(item.end_time));
      }

      words.push({
        text: alternative.content || '',
        start: startTime,
        end: endTime,
        conf: alternative.confidence ? convertToNumber(alternative.confidence) : 0,
      });
    }
  }

  return words;
};

/**
 * Processes audio segments to create output segments with words
 * @param {object} transcriptData - Transcription data containing items and audioSegments
 * @returns {Array} Array of segments
 */
const createSegmentsFromAudioSegments = (transcriptData) => {
  const { items, audio_segments: audioSegments } = transcriptData;

  if (!audioSegments || audioSegments.length === 0) {
    return [];
  }

  const segments = [];

  // Using traditional for loop instead of for...of to comply with ESLint rules
  for (let i = 0; i < audioSegments.length; i += 1) {
    const segment = audioSegments[i];

    // Create the text for the segment by joining the content of the items
    let segmentText = '';
    for (let j = 0; j < segment.items.length; j += 1) {
      const itemIndex = segment.items[j];
      const item = items[itemIndex];

      if (item.alternatives && item.alternatives.length > 0) {
        const content = item.alternatives[0].content || '';
        // Add space before content if segmentText is not empty and content is not punctuation
        if (segmentText.length > 0 && !content.match(/^[.,!?;:)]+$/)) {
          segmentText += ' ';
        }
        segmentText += content;
      }
    }

    segments.push({
      start: formatWithComma(convertToNumber(segment.start_time)),
      end: formatWithComma(convertToNumber(segment.end_time)),
      text: segmentText,
      words: createWordsForSegment(items, segment.items),
    });
  }

  return segments;
};

/**
 * Calculates the duration from items
 * @param {Array} items - Array of transcription items
 * @returns {string} Duration formatted with comma as decimal separator
 */
const calculateDuration = (items) => {
  if (!items || items.length === 0) {
    return '0,0';
  }

  let maxEnd = 0;

  // Using traditional for loop instead of for...of to comply with ESLint rules
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    // Skip items without timing information
    if (!item.end_time) {
      // Using return instead of continue to comply with ESLint rules
      // eslint-disable-next-line no-continue
      continue; // eslint-disable-line no-continue
    }

    const endTime = parseFloat(item.end_time);
    if (!Number.isNaN(endTime) && endTime > maxEnd) {
      maxEnd = endTime;
    }
  }

  return formatWithComma(maxEnd);
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
        duration: '0,0',
        segments: [],
      };
    }

    // Extract transcription data
    const transcriptionData = parsedTranscript;

    // Process audio segments to create output segments
    const segments = createSegmentsFromAudioSegments(transcriptionData);

    // Calculate duration
    const duration = calculateDuration(transcriptionData.items || []);

    // Return normalized structure matching the required format
    return {
      duration,
      segments,
    };
  } catch (error) {
    console.error('Error normalizing transcript:', error);
    return {
      duration: '0,0',
      segments: [],
    };
  }
};
