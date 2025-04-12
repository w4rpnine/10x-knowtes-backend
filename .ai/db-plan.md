# Database Schema for 10x-knowtes

## Tables

### users
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `email` TEXT NOT NULL UNIQUE
- `encrypted_password` TEXT NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### topics
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `parent_id` UUID REFERENCES topics(id) ON DELETE CASCADE
- `name` TEXT NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### notes
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `topic_id` UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `content` TEXT NOT NULL CHECK (length(content) <= 3000)
- `character_count` INTEGER NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### summaries
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `topic_id` UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `content` TEXT NOT NULL CHECK (length(content) <= 3000)
- `character_count` INTEGER NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### references
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `source_note_id` UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE
- `target_note_id` UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE (`source_note_id`, `target_note_id`)

## Relationships

1. **One-to-Many: User → Topics**
   - Each user can have multiple topics
   - Each topic belongs to one user

2. **One-to-Many: User → Notes**
   - Each user can have multiple notes
   - Each note belongs to one user

3. **One-to-Many: Topic → Notes**
   - Each topic can contain multiple notes
   - Each note belongs to one topic

4. **One-to-Many: Topic → Topics (Self-Reference)**
   - Each topic can have multiple child topics
   - Each topic can have one parent topic (or none if it's a root topic)

5. **One-to-Many: Topic → Summaries**
   - Each topic can have multiple summaries
   - Each summary belongs to one topic

6. **Many-to-Many: Notes → Notes (through References)**
   - Each note can reference multiple other notes
   - Each note can be referenced by multiple other notes

## Indexes

1. `topics_user_id_idx` ON `topics(user_id)`
2. `topics_parent_id_idx` ON `topics(parent_id)`
3. `notes_user_id_idx` ON `notes(user_id)`
4. `notes_topic_id_idx` ON `notes(topic_id)`
5. `summaries_user_id_idx` ON `summaries(user_id)`
6. `summaries_topic_id_idx` ON `summaries(topic_id)`
7. `references_source_note_id_idx` ON `references(source_note_id)`
8. `references_target_note_id_idx` ON `references(target_note_id)`
9. `notes_content_gin_idx` ON `notes(content)` USING gin (to_tsvector('english', content))

## Row Level Security (RLS) Policies

### users

```sql
CREATE POLICY users_isolation_policy ON users
    USING (id = auth.uid());
```

### topics

```sql
CREATE POLICY topics_isolation_policy ON topics
    USING (user_id = auth.uid());
```

### notes

```sql
CREATE POLICY notes_isolation_policy ON notes
    USING (user_id = auth.uid());
```

### summaries

```sql
CREATE POLICY summaries_isolation_policy ON summaries
    USING (user_id = auth.uid());
```

### references

```sql
CREATE POLICY references_isolation_policy ON references
    USING (user_id = auth.uid());
```

## Views and Functions

### notes_per_topic
```sql
CREATE OR REPLACE VIEW notes_per_topic AS
SELECT 
    topics.id AS topic_id,
    topics.name AS topic_name,
    topics.user_id,
    COUNT(notes.id) AS note_count
FROM 
    topics
LEFT JOIN 
    notes ON topics.id = notes.topic_id
GROUP BY 
    topics.id;
```

### update_character_count
```sql
CREATE OR REPLACE FUNCTION update_character_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.character_count = length(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_character_count_trigger
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_character_count();

CREATE TRIGGER summaries_character_count_trigger
BEFORE INSERT OR UPDATE ON summaries
FOR EACH ROW
EXECUTE FUNCTION update_character_count();
```

## Design Notes

1. **Hierarchical Structure**:
   - The topics table uses self-referencing with parent_id to create a hierarchical structure.
   - This allows for unlimited nesting of topics and subtopics.

2. **Security and Data Isolation**:
   - Row Level Security (RLS) is used on all tables to ensure complete data isolation between users.
   - Each record is tied to a specific user_id, and RLS policies ensure users can only access their own data.

3. **Optimization for Read Performance**:
   - Indexes are created on frequently queried columns, especially foreign keys.
   - The GIN index on notes.content will facilitate efficient full-text search in the future.

4. **Character Limit Enforcement**:
   - CHECK constraints on notes and summaries enforce the 3000 character limit.
   - The update_character_count trigger function automatically calculates and updates character_count.

5. **UUID Primary Keys**:
   - All tables use UUID primary keys instead of sequential integers.
   - This provides better security and facilitates future sharing functionality.

6. **Metrics Tracking**:
   - The notes_per_topic view provides quick access to the number of notes per topic.

7. **References Implementation**:
   - The references table implements the @-mention functionality, allowing notes to reference other notes.
   - Each reference links a source note to a target note. 