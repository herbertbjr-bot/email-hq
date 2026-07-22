import styles from "./SmartTagBadge.module.css";

/**
 * Renders AI-suggested tags for a message. Tags are produced today by the
 * rule-based placeholder in backend/app/services/ai/tagging.py - swap that
 * service for a real classifier and this component needs no changes.
 */
export function SmartTagBadge({ tag }: { tag: string }) {
  return <span className={styles.badge}>{tag}</span>;
}

export function SmartTagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className={styles.list}>
      {tags.map((tag) => (
        <SmartTagBadge key={tag} tag={tag} />
      ))}
    </div>
  );
}
