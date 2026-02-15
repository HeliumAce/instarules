// Query Services - Clean exports for query processing and source formatting functionality
export { QueryProcessingService } from './QueryProcessingService';
export { QueryClassificationService } from './QueryClassificationService';
export { QueryExpansionService } from './QueryExpansionService';
export { FollowUpProcessingService } from './FollowUpProcessingService';
// TODO: Add SourceFormattingService export when created

// Type exports
export type { QueryType, QueryProcessingOptions, QueryProcessingResult } from './QueryProcessingService';
export type { QueryAnalysis } from './QueryClassificationService';
export type { QueryExpansionOptions, QueryExpansionResult } from './QueryExpansionService';
export type { FollowUpProcessingOptions, FollowUpProcessingResult } from './FollowUpProcessingService';
// TODO: Add SourceFormattingService types when created 