import type { SupabaseClient } from '../../db/supabase.client';
import type { TopicDTO } from '../../types';
import { updateTopicSchema } from '../schemas/topic.schema';

export class TopicService {
  constructor(private readonly supabase: SupabaseClient) {}

  async updateTopic(id: string, userId: string, command: { title: string }): Promise<TopicDTO> {
    // Validate the command
    const validatedData = await updateTopicSchema.parseAsync({ title: command.title });

    // Verify topic exists and user has access
    const { data: existingTopic, error: fetchError } = await this.supabase
      .from('topics')
      .select()
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTopic) {
      throw new Error('Topic not found or access denied');
    }

    // Update the topic
    const { data: updatedTopic, error: updateError } = await this.supabase
      .from('topics')
      .update({ 
        title: validatedData.title,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updatedTopic) {
      throw new Error('Failed to update topic');
    }

    return updatedTopic;
  }
} 