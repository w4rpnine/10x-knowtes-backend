# 10x-knowtes Database Schema

## Tables

### topics
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL CHECK (length(title) > 0 AND length(title) <= 150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### notes
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL CHECK (length(title) <= 150),
  content TEXT NOT NULL CHECK (length(content) <= 3000),
  is_summary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### summary_stats
```sql
CREATE TABLE summary_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  summary_note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted BOOLEAN NOT NULL DEFAULT false
);
```

## Relationships

1. **User to Topics**: One-to-Many (One user can have many topics)
   - Foreign key: `topics.user_id` references `auth.users.id`

2. **User to Notes**: One-to-Many (One user can have many notes)
   - Foreign key: `notes.user_id` references `auth.users.id`

3. **Topic to Notes**: One-to-Many (One topic can contain many notes)
   - Foreign key: `notes.topic_id` references `topics.id`

4. **User to Summary Stats**: One-to-Many (One user can have many summary statistics)
   - Foreign key: `summary_stats.user_id` references `auth.users.id`

5. **Topic to Summary Stats**: One-to-Many (One topic can have many summary statistics)
   - Foreign key: `summary_stats.topic_id` references `topics.id`

6. **Note to Summary Stats**: One-to-Many (One summary note can be referenced in many stats)
   - Foreign key: `summary_stats.summary_note_id` references `notes.id`

## Indexes

```sql
-- Indexes for topics table
CREATE INDEX idx_topics_user_id ON topics(user_id);

-- Indexes for notes table
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_topic_id ON notes(topic_id);
CREATE INDEX idx_notes_is_summary ON notes(is_summary);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_topic_is_summary ON notes(topic_id, is_summary);

-- Indexes for summary_stats table
CREATE INDEX idx_summary_stats_user_id ON summary_stats(user_id);
CREATE INDEX idx_summary_stats_topic_id ON summary_stats(topic_id);
CREATE INDEX idx_summary_stats_summary_note_id ON summary_stats(summary_note_id);
CREATE INDEX idx_summary_stats_accepted ON summary_stats(accepted);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_stats ENABLE ROW LEVEL SECURITY;

-- Topic policies
CREATE POLICY topics_select_policy ON topics 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY topics_insert_policy ON topics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY topics_update_policy ON topics 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY topics_delete_policy ON topics 
  FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY notes_select_policy ON notes 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notes_insert_policy ON notes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notes_update_policy ON notes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notes_delete_policy ON notes 
  FOR DELETE USING (auth.uid() = user_id);

-- Summary stats policies
CREATE POLICY summary_stats_select_policy ON summary_stats 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY summary_stats_insert_policy ON summary_stats 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY summary_stats_update_policy ON summary_stats 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY summary_stats_delete_policy ON summary_stats 
  FOR DELETE USING (auth.uid() = user_id);
```

## Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for topics table
CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for notes table
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

## Design Notes

1. **Flat Hierarchy**: As per MVP requirements, the schema implements a flat hierarchy (one level of topics containing notes) without nested topics.

2. **Note Summaries**: Summaries are stored as regular notes with `is_summary` flag set to `true`. This allows for consistent querying and functionality.

3. **Data Constraints**: 
   - Title length is limited to 150 characters
   - Note content is limited to 3000 characters
   - Topics must have a non-empty title

4. **Security**: Row Level Security (RLS) ensures that users can only access their own data.

5. **Cascading Deletes**: 
   - When a user is deleted, all their topics, notes, and summary stats are automatically deleted
   - When a topic is deleted, all associated notes and summary stats are automatically deleted
   - When a summary note is deleted, the reference in summary_stats is set to NULL

6. **Performance Optimization**: 
   - Indexes are created on frequently queried columns
   - Composite indexes are used for common query patterns (e.g., finding summaries within a topic)

7. **Automatic Timestamps**: 
   - `created_at` is set automatically on record creation
   - `updated_at` is automatically updated on record modification through triggers

This schema provides a solid foundation for the 10x-knowtes application while adhering to the MVP requirements and taking into account the decisions made during the planning session. 