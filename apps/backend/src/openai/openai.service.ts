import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      this.logger.error(
        'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
      );
      throw new Error('OpenAI API key is required but not configured');
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async processInput(userInput: string): Promise<string> {
    try {
      this.logger.log(`Processing input: ${userInput.substring(0, 50)}...`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. Provide clear and concise responses.',
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
        max_tokens: 500,
      });

      const result = completion.choices[0]?.message?.content || 'No response';
      this.logger.log('AI processing completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error processing with OpenAI:', error);
      throw error;
    }
  }
}
