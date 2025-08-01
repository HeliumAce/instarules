# PRD: Embedding Ingestion System Optimization

## Introduction/Overview

The current embedding ingestion system for game rules suffers from two critical issues: **546 resource limit errors** causing ~1% failure rate and **over-fragmented chunking** that produces incomplete semantic context. Board game rules require precision, and the current 99.1% success rate with fragmented sources is unacceptable for providing accurate rule interpretations.

This feature will redesign the embedding ingestion pipeline to achieve 100% reliability while producing semantically meaningful chunks that preserve complete rule context and sources.

## Goals

1. **Achieve 100% embedding ingestion success rate** (eliminating all 546 resource errors)
2. **Implement semantic-aware chunking** that preserves complete rule context
3. **Reduce processing time** through optimized batch processing and resource management
4. **Ensure complete source attribution** with full context rather than fragmented snippets

## User Stories

**As a developer maintaining the system:**
- I want 100% reliable embedding ingestion so that I never have incomplete rule databases
- I want clear error reporting and automatic retry mechanisms so that failures are self-healing
- I want faster processing so that rule updates don't take hours to complete

**As an end user querying Arcs rules:**
- I want complete, contextual rule explanations so that I get accurate interpretations
- I want full source attribution so that I can verify the complete rule context
- I want consistent search quality across all types of rule content

## Functional Requirements

### Core Processing Requirements
1. **The system MUST achieve 99.9%+ success rate** for embedding generation across all content types
2. **The system MUST support semantic chunking** that preserves complete rule sections rather than arbitrary character limits
3. **The system MUST handle larger text chunks** without hitting memory/resource limits
4. **The system MUST provide complete source attribution** with full context for each embedding

### Error Handling & Reliability
6. **The system MUST implement automatic retry logic** for failed embedding requests
7. **The system MUST provide detailed error logging** with specific failure reasons and affected content
8. **The system MUST support incremental processing** to resume from failure points
9. **The system MUST validate embedding quality** before marking ingestion as complete

### Performance & Scalability
9. **The system MUST process embeddings efficiently** using optimal batch sizes for the target infrastructure
10. **The system MUST support concurrent processing** for large rule sets
11. **The system MUST implement resource monitoring** to prevent memory/CPU limit violations
12. **The system MUST support streaming processing** to avoid memory accumulation

### Architecture & Flexibility
13. **The system MUST support multiple embedding backends** (Edge Functions, external APIs, local processing)
14. **The system MUST provide configurable chunking strategies** per content type
15. **The system MUST implement proper abstraction layers** separating chunking, embedding, and storage concerns

## Non-Goals (Out of Scope)

- **Real-time embedding generation** during user queries (batch processing only)
- **Custom embedding models** (will use existing gte-small initially)
- **GUI/dashboard interface** for monitoring (CLI/logging sufficient for now)
- **Multi-tenancy support** (single workspace focus)
- **Backwards compatibility** with existing fragmented embeddings (fresh ingestion acceptable)

## Design Considerations

### Technical Architecture Options
1. **Enhanced Edge Functions**: Optimize current Supabase Edge Functions with streaming and memory management
2. **External Processing Service**: Move embedding generation to external service (OpenAI, Hugging Face, etc.)
3. **Hybrid Approach**: Use Edge Functions for small batches, external service for large batches
4. **Local Processing**: Process embeddings locally then upload (for development/testing)

### Chunking Strategy
- **Semantic boundaries**: Respect heading hierarchy and logical rule sections
- **Configurable sizing**: Per-content-type chunk size strategies
- **Context preservation**: Maintain heading context and cross-references within chunks
- **Source completeness**: Ensure each chunk contains complete, self-contained information

### Error Recovery
- **Batch-level retry**: Retry failed batches with exponential backoff
- **Chunk-level fallback**: Process individual chunks when batch processing fails
- **Content validation**: Verify chunk completeness before embedding generation
- **Graceful degradation**: Smaller batch sizes when resource limits are encountered

## Technical Considerations

### Infrastructure Requirements
- **Memory optimization**: Streaming processing to avoid accumulation
- **Resource monitoring**: Real-time tracking of memory/CPU usage
- **Concurrent processing**: Parallel execution with resource pooling
- **Error instrumentation**: Comprehensive logging and monitoring

### Data Dependencies
- **Markdown processor**: Enhanced semantic chunking capabilities
- **Database schema**: Support for larger chunks and complete source attribution
- **Configuration system**: Content-type-aware processing parameters
- **Validation framework**: Embedding quality and completeness verification

### Integration Points
- **Supabase Edge Functions**: Current embedding generation endpoint
- **Database ingestion**: Batch insertion with transaction safety
- **File processing**: Enhanced markdown parsing and chunking
- **Monitoring/logging**: Comprehensive observability for debugging

## Success Metrics

### Primary Metrics
- **Success Rate**: 99.9%+ embedding generation success (target: 100%)
- **Processing Time**: <2 hours for complete Arcs rule set (currently several hours)
- **Source Completeness**: 100% of chunks contain complete, self-contained rule context

### Secondary Metrics
- **Search Quality**: Improved semantic relevance in rule queries
- **Error Recovery**: <5 minutes average time to recover from failures
- **Memory Efficiency**: Stable memory usage without accumulation during processing

### Quality Metrics
- **Chunk Coherence**: Each chunk contains complete rule sections without fragmentation
- **Cross-reference Integrity**: Related rules maintain proper connections across chunks
- **Context Preservation**: Complete heading hierarchy and rule context maintained

## Implementation Phases

### Phase 1: Technical Foundation (Week 1)
- Fix immediate 546 errors through Edge Function optimization
- Implement basic retry logic and error handling
- Add comprehensive logging and monitoring

### Phase 2: Semantic Enhancement (Week 2)
- Redesign chunking strategy for semantic completeness
- Implement configurable chunking per content type
- Enhance source attribution and context preservation

### Phase 3: Testing & Optimization (Week 3)
- Implement automated testing framework
- Add performance monitoring and optimization
- Optimize chunking strategies based on test results

### Phase 4: Validation & Documentation (Week 4)
- Comprehensive testing with complete Arcs rule set
- Performance benchmarking and optimization
- Documentation and operational procedures

## Open Questions

1. **Embedding Model Selection**: Should we evaluate alternative embedding models for better performance/accuracy?
2. **Processing Infrastructure**: What's the optimal infrastructure choice for large-scale processing?
3. **Content Validation**: How do we automatically validate that chunked content maintains rule accuracy?
4. **Migration Strategy**: How do we handle transitioning from current fragmented embeddings to new semantic chunks?
5. **Cost Optimization**: What's the most cost-effective approach for processing large rule sets on paid Supabase plans?

## Acceptance Criteria

The feature is complete when:
- [ ] 100% embedding ingestion success rate achieved across all test content
- [ ] Semantic chunking produces complete, self-contained rule sections
- [ ] System processes Arcs rule set without any 546 errors
- [ ] Automated tests validate both technical reliability and semantic quality
- [ ] Processing time improved by at least 50% over current implementation
- [ ] Complete source attribution available for all embedded content 