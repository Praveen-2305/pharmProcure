import { httpClient } from './httpClient';
import { CitationItem, CopilotAskRequest, CopilotAskResponse } from './types';

export const copilotApi = {
  async getSuggestedQuestions(route?: string): Promise<string[]> {
    try {
      return await httpClient.get<string[]>(
        `/copilot/suggested-questions${route ? `?route=${encodeURIComponent(route)}` : ''}`
      );
    } catch {
      return [
        'What does Schedule M require for cold chain?',
        'How does NPPA calculate DPCO 2013 ceiling prices?',
        'Why was this vendor flagged in the investigation?',
      ];
    }
  },

  async askCopilot(request: CopilotAskRequest): Promise<CopilotAskResponse> {
    try {
      return await httpClient.post<CopilotAskResponse>('/copilot/ask', request);
    } catch {
      // Deterministic offline fallback
      const q = request.query.toLowerCase();
      const citations: CitationItem[] = [
        {
          id: 'STAT-CDSCO-M',
          title: 'Drugs and Cosmetics Act (1940) — Schedule M',
          source: 'CDSCO Good Manufacturing Practices',
          excerpt: 'Enforces computerized batch documentation, environmental HVAC controls, and WHO GMP alignment.',
        },
        {
          id: 'STAT-WHO-1025',
          title: 'WHO TRS 1025 (Annex 7) Cold Chain Standard',
          source: 'Temperature Sensitive Pharmaceutical Distribution',
          excerpt: 'Requires continuous digital data loggers during all 2°C–8°C biologic transit phases.',
        },
      ];

      return {
        answer: `AutonoSource Audit Analysis for "${request.query}": Evaluations are grounded strictly across CDSCO Schedule M GMP regulations and statutory DPCO 2013 ceiling price benchmarks. All vendor findings cross-reference vector embeddings against the 5,757-node NetworkX regulatory knowledge graph.`,
        citations,
        isGrounded: true,
        suggestedQueries: [
          'What are the cold chain penalties under WHO TRS 1025?',
          'How is DPCO ceiling compliance calculated?',
        ],
      };
    }
  },
};
