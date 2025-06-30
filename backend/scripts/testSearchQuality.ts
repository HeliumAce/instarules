import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  source_file: string;
  h1_heading: string;
  similarity: number;
}

async function testSearchQuality() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    console.log('🔍 Testing Search Quality with New 384-Dimensional Embeddings\n');
    console.log('==================================================');

    // Define test queries that cover different aspects of Arcs gameplay
    const testQueries = [
        {
            query: "How do I win the game?",
            category: "Basic Rules",
            expectedSources: ["rules"],
            minResults: 3
        },
        {
            query: "What are the different types of cards?",
            category: "Card Types",
            expectedSources: ["cards"],
            minResults: 5
        },
        {
            query: "How does combat work?",
            category: "Combat Mechanics", 
            expectedSources: ["rules"],
            minResults: 3
        },
        {
            query: "What is the Empire card?",
            category: "Specific Card",
            expectedSources: ["cards"],
            minResults: 2
        },
        {
            query: "When can I take the Influence action?",
            category: "Action Timing",
            expectedSources: ["rules"],
            minResults: 2
        },
        {
            query: "What happens during the Court phase?",
            category: "Game Phases",
            expectedSources: ["rules"],
            minResults: 3
        },
        {
            query: "How do resources work?",
            category: "Resources",
            expectedSources: ["rules"],
            minResults: 3
        },
        {
            query: "What are Blight cards?",
            category: "Blighted Reach",
            expectedSources: ["cards", "rules"],
            minResults: 2
        }
    ];

    let totalTests = 0;
    let passedTests = 0;
    const results: Array<{
        query: string;
        category: string;
        resultCount: number;
        avgSimilarity: number;
        topSimilarity: number;
        sources: string[];
        passed: boolean;
        issues: string[];
    }> = [];

    for (const test of testQueries) {
        totalTests++;
        console.log(`\n📝 Testing: "${test.query}"`);
        console.log(`   Category: ${test.category}`);
        
        try {
            const { data, error } = await supabase.functions.invoke('vector-search', {
                body: { query: test.query }
            });

            if (error) {
                console.log(`   ❌ Error: ${error.message}`);
                results.push({
                    query: test.query,
                    category: test.category,
                    resultCount: 0,
                    avgSimilarity: 0,
                    topSimilarity: 0,
                    sources: [],
                    passed: false,
                    issues: [`Search error: ${error.message}`]
                });
                continue;
            }

            const searchResults = data as SearchResult[];
            const issues: string[] = [];
            
            // Basic validation
            if (!Array.isArray(searchResults)) {
                issues.push('Results not returned as array');
            } else if (searchResults.length === 0) {
                issues.push('No results returned');
            } else if (searchResults.length < test.minResults) {
                issues.push(`Too few results: ${searchResults.length} < ${test.minResults}`);
            }

            // Calculate metrics
            const similarities = searchResults.map(r => r.similarity);
            const avgSimilarity = similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0;
            const topSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0;
            const sources = [...new Set(searchResults.map(r => r.source_file))];

            // Check similarity thresholds
            if (topSimilarity < 0.4) {
                issues.push(`Low top similarity: ${topSimilarity.toFixed(3)}`);
            }
            if (avgSimilarity < 0.3) {
                issues.push(`Low average similarity: ${avgSimilarity.toFixed(3)}`);
            }

            // Check source diversity
            const hasExpectedSources = test.expectedSources.some(expectedType => 
                sources.some(source => source.toLowerCase().includes(expectedType))
            );
            if (!hasExpectedSources) {
                issues.push(`Missing expected source types: ${test.expectedSources.join(', ')}`);
            }

            const passed = issues.length === 0;
            if (passed) {
                passedTests++;
                console.log(`   ✅ PASSED`);
            } else {
                console.log(`   ❌ FAILED: ${issues.join(', ')}`);
            }

            console.log(`   📊 Results: ${searchResults.length}, Top similarity: ${topSimilarity.toFixed(3)}, Avg: ${avgSimilarity.toFixed(3)}`);
            console.log(`   📁 Sources: ${sources.map(s => s.replace('.md', '')).join(', ')}`);

            // Show top 2 results for reference
            if (searchResults.length > 0) {
                console.log(`   🔍 Top result: "${searchResults[0].content.substring(0, 100)}..."`);
                if (searchResults.length > 1) {
                    console.log(`   🔍 2nd result: "${searchResults[1].content.substring(0, 100)}..."`);
                }
            }

            results.push({
                query: test.query,
                category: test.category,
                resultCount: searchResults.length,
                avgSimilarity,
                topSimilarity,
                sources,
                passed,
                issues
            });

        } catch (err) {
            console.log(`   ❌ Exception: ${err}`);
            results.push({
                query: test.query,
                category: test.category,
                resultCount: 0,
                avgSimilarity: 0,
                topSimilarity: 0,
                sources: [],
                passed: false,
                issues: [`Exception: ${err}`]
            });
        }
    }

    // Summary
    console.log('\n🎯 SEARCH QUALITY TEST SUMMARY');
    console.log('==================================================');
    console.log(`📊 Overall Score: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);
    
    const avgTopSimilarity = results.reduce((sum, r) => sum + r.topSimilarity, 0) / results.length;
    const avgAvgSimilarity = results.reduce((sum, r) => sum + r.avgSimilarity, 0) / results.length;
    const avgResultCount = results.reduce((sum, r) => sum + r.resultCount, 0) / results.length;
    
    console.log(`📈 Average top similarity: ${avgTopSimilarity.toFixed(3)}`);
    console.log(`📈 Average avg similarity: ${avgAvgSimilarity.toFixed(3)}`);
    console.log(`📈 Average result count: ${avgResultCount.toFixed(1)}`);

    // Category breakdown
    const categories = [...new Set(results.map(r => r.category))];
    console.log('\n📋 Results by Category:');
    for (const category of categories) {
        const categoryResults = results.filter(r => r.category === category);
        const categoryPassed = categoryResults.filter(r => r.passed).length;
        console.log(`   ${category}: ${categoryPassed}/${categoryResults.length} passed`);
    }

    // Failed tests detail
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests Details:');
        for (const failed of failedTests) {
            console.log(`   "${failed.query}": ${failed.issues.join(', ')}`);
        }
    }

    // Overall assessment
    const overallQuality = passedTests / totalTests;
    console.log('\n🏆 OVERALL ASSESSMENT:');
    if (overallQuality >= 0.9) {
        console.log('✅ EXCELLENT: Search quality is excellent (≥90% pass rate)');
    } else if (overallQuality >= 0.75) {
        console.log('✅ GOOD: Search quality is good (≥75% pass rate)');
    } else if (overallQuality >= 0.6) {
        console.log('⚠️  ACCEPTABLE: Search quality is acceptable but could be improved (≥60% pass rate)');
    } else {
        console.log('❌ POOR: Search quality needs improvement (<60% pass rate)');
    }

    return {
        totalTests,
        passedTests,
        overallQuality,
        avgTopSimilarity,
        avgAvgSimilarity,
        avgResultCount
    };
}

// Run the test
testSearchQuality().catch(console.error); 