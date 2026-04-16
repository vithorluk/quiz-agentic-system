declare module '@xenova/transformers' {
  export interface PipelineOptions {
    pooling?: 'mean' | 'cls';
    normalize?: boolean;
  }

  export interface EmbeddingOutput {
    data: Float32Array | number[];
  }

  export type Pipeline = (
    text: string,
    options?: PipelineOptions
  ) => Promise<EmbeddingOutput>;

  export function pipeline(
    task: 'feature-extraction' | 'text-classification' | 'token-classification' | 'question-answering' | 'summarization' | 'translation' | 'text-generation',
    model: string
  ): Promise<Pipeline>;
}
