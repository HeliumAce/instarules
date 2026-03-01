/**
 * Full Context Source Service
 *
 * Extracts sources from full-context markdown rulebooks.
 * Parses markdown headings with page numbers and matches relevant sections
 * to user questions using keyword matching.
 */

import { RuleSource, Source } from './SourceConversionService';

interface ParsedSection {
  heading: string;
  headingHierarchy: string[];
  pageNumber?: number;
  content: string;
  level: number;
}

export interface FullContextMessageSources {
  count: number;
  sources: Source[];
}

export class FullContextSourceService {
  /**
   * Parses a markdown rulebook into sections with headings and page numbers.
   */
  static parseMarkdownSections(markdown: string): ParsedSection[] {
    const lines = markdown.split('\n');
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;
    const headingStack: string[] = []; // Track heading hierarchy

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentSection.content.trim();
          if (currentSection.content) {
            sections.push(currentSection);
          }
        }

        const level = headingMatch[1].length;
        const rawHeading = headingMatch[2].trim();

        // Extract page number from heading like "INTRODUCTION (Page 1)"
        const pageMatch = rawHeading.match(/^(.+?)\s*\(Page\s+(\d+)\)\s*$/i);
        const heading = pageMatch ? pageMatch[1].trim() : rawHeading;
        const pageNumber = pageMatch ? parseInt(pageMatch[2], 10) : undefined;

        // Update heading hierarchy
        while (headingStack.length >= level) {
          headingStack.pop();
        }
        headingStack.push(heading);

        currentSection = {
          heading,
          headingHierarchy: [...headingStack],
          pageNumber,
          content: '',
          level,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    // Don't forget the last section
    if (currentSection) {
      currentSection.content = currentSection.content.trim();
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }

    return sections;
  }

  /**
   * Finds sections relevant to a question using keyword matching.
   * Returns the top matching sections as sources.
   */
  static findRelevantSources(
    markdown: string,
    question: string,
    gameName: string,
    maxSources: number = 5
  ): FullContextMessageSources {
    const sections = this.parseMarkdownSections(markdown);
    const normalizedQuestion = question.toLowerCase().trim();
    const queryWords = normalizedQuestion
      .split(/\W+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    if (queryWords.length === 0) {
      return { count: 0, sources: [] };
    }

    const scored = sections
      .map(section => ({
        section,
        score: this.scoreSection(section, normalizedQuestion, queryWords),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSources);

    // Propagate page numbers from parent sections if missing
    const allSections = sections;
    const sources: RuleSource[] = scored.map((item, index) => {
      const pageNumber = item.section.pageNumber ?? this.findNearestPageNumber(item.section, allSections);

      return {
        id: `fullctx-${index}`,
        contentType: 'rule' as const,
        title: item.section.heading,
        sourceHeading: item.section.heading,
        bookName: `${gameName} Rules`,
        pageNumber,
        content: item.section.content,
      };
    });

    // Deduplicate by heading + page number
    const seen = new Set<string>();
    const deduped = sources.filter(source => {
      const key = `${source.sourceHeading}-${source.pageNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      count: deduped.length,
      sources: deduped,
    };
  }

  /**
   * Scores how relevant a section is to the question.
   */
  private static scoreSection(
    section: ParsedSection,
    normalizedQuestion: string,
    queryWords: string[]
  ): number {
    let score = 0;
    const headingLower = section.heading.toLowerCase();
    const contentLower = section.content.toLowerCase();
    const combinedLower = headingLower + ' ' + contentLower;

    // Exact phrase match in content
    if (combinedLower.includes(normalizedQuestion)) {
      score += 15;
    }

    // All query words present
    let allWordsFound = queryWords.length > 0;
    let wordMatchCount = 0;
    for (const word of queryWords) {
      if (combinedLower.includes(word)) {
        wordMatchCount++;
        score += 2;
      } else {
        allWordsFound = false;
      }
    }
    if (allWordsFound) {
      score += 10;
    }

    // Heading matches (weighted higher)
    for (const word of queryWords) {
      if (headingLower.includes(word)) {
        score += 3;
      }
    }
    if (headingLower.includes(normalizedQuestion)) {
      score += 5;
    }

    // Penalize very short sections (likely just headers with no useful content)
    if (section.content.length < 20) {
      score *= 0.3;
    }

    return score;
  }

  /**
   * Finds the nearest page number from a parent or preceding section.
   */
  private static findNearestPageNumber(
    section: ParsedSection,
    allSections: ParsedSection[]
  ): number | undefined {
    const idx = allSections.indexOf(section);

    // Look backwards for the nearest section with a page number at same or higher level
    for (let i = idx - 1; i >= 0; i--) {
      if (allSections[i].pageNumber !== undefined && allSections[i].level <= section.level) {
        return allSections[i].pageNumber;
      }
    }

    // Fallback: any preceding section with a page number
    for (let i = idx - 1; i >= 0; i--) {
      if (allSections[i].pageNumber !== undefined) {
        return allSections[i].pageNumber;
      }
    }

    return undefined;
  }
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'with', 'by', 'about',
  'how', 'what', 'why', 'when', 'where', 'who', 'which', 'is', 'are', 'do',
  'does', 'can', 'could', 'would', 'should', 'if', 'and', 'or', 'but', 'not',
  'from', 'that', 'this', 'these', 'those', 'its', 'has', 'have', 'had',
  'was', 'were', 'been', 'being', 'will', 'may', 'might', 'shall', 'must',
  'per', 'each', 'every', 'all', 'any', 'some', 'many', 'much', 'more',
  'most', 'other', 'than', 'then', 'also', 'just', 'only', 'very', 'too',
  'after', 'before', 'during', 'into', 'through', 'between', 'over', 'under',
]);