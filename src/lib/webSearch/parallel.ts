// Simplified Parallel AI Search SDK - Function-based approach

export interface SearchResult {
	url: string;
	title: string;
	excerpts: string[];
}

export interface QueryResult {
	query: string;
	results: SearchResult[];
}

export interface SearchResponse {
	search_id: string;
	query_results: QueryResult[];
}

export interface SearchOptions {
	processor?: 'base' | 'pro';
	max_results?: number;
	max_chars_per_result?: number;
	include_domains?: string[];
	exclude_domains?: string[];
	objective?: string; // Optional context for what you're trying to achieve
}

/**
 * Search the web using Parallel AI
 * @param apiKey Your Parallel AI API key
 * @param queries Array of search queries (or single query string)
 * @param options Optional search configuration
 * @returns Promise with search results organized by query
 */
export async function parallelSearch(
	apiKey: string,
	queries: string[] | string,
	options: SearchOptions = {}
): Promise<SearchResponse> {
	// Convert single query to array
	const queryArray = Array.isArray(queries) ? queries : [queries];

	// Build request payload
	const payload = {
		objective: options.objective || queryArray[0] || 'Search for information',
		search_queries: queryArray,
		processor: options.processor || 'base',
		max_results: options.max_results || 20,
		max_chars_per_result: options.max_chars_per_result || 6000,
		...(options.include_domains?.length || options.exclude_domains?.length
			? {
					source_policy: {
						...(options.include_domains?.length && { include_domains: options.include_domains }),
						...(options.exclude_domains?.length && { exclude_domains: options.exclude_domains }),
					},
				}
			: {}),
	};

	// Make API request
	const response = await fetch('https://api.parallel.ai/v1beta/search', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Parallel AI API error: ${response.status} - ${errorText}`);
	}

	const result = await response.json();

	// Transform to consistent format
	return {
		search_id: result.search_id,
		query_results: queryArray.map((query, index) => ({
			query,
			results: result.results || [], // Note: Current API returns all results together
		})),
	};
}

// Convenience wrapper for single queries that returns results directly
export async function parallelSearchSingle(
	apiKey: string,
	query: string,
	options: SearchOptions = {}
): Promise<SearchResult[]> {
	const response = await parallelSearch(apiKey, query, options);
	return response.query_results[0]?.results || [];
}

export default parallelSearch;
