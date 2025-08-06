/**
 * Sources Service Layer
 * 
 * Exports all source-related services for clean imports.
 * Each service has a single responsibility following SRP.
 */

// Export main services
export { SourceConversionService } from './SourceConversionService';
export { SourceDeduplicationService } from './SourceDeduplicationService';
export { SourceSortingService } from './SourceSortingService';
export { SourceFormattingService } from './SourceFormattingService';

// Export types
export type { 
  Source, 
  RuleSource, 
  CardSource
} from './SourceConversionService';

export type {
  MessageSources
} from './SourceFormattingService';

export type {
  DeduplicationOptions,
  DeduplicationResult,
  QualityComparisonOptions,
  SimilarityCheckOptions
} from './SourceDeduplicationService';

export type {
  SortingOptions,
  SortingResult,
  GroupingOptions,
  SortMethod
} from './SourceSortingService'; 