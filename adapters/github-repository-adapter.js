export const githubRepositoryAdapter = {
  id: 'github-repository',
  kind: 'REPOSITORY',
  capabilities: ['health.read', 'version.read', 'metadata.read'],
  refreshMs: 15 * 60 * 1000,
  maxAgeMs: 20 * 60 * 1000,

  async probe(target) {
    if (!target?.owner || !target?.repo) throw new Error('GitHub target requires owner and repo');
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    if (response.status === 404) {
      return { status: 'UNKNOWN', detail: 'Repository nicht öffentlich sichtbar; privat, nicht vorhanden oder Zugriff fehlt' };
    }
    if (response.status === 403 || response.status === 429) {
      return { status: 'DEGRADED', detail: `GitHub API limitiert (HTTP ${response.status}); letzte bestätigte Messung weiter beachten` };
    }
    if (!response.ok) {
      throw new Error(`GitHub HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      status: data.archived ? 'DEGRADED' : 'HEALTHY',
      detail: data.archived ? 'Repository archiviert' : 'Repository erreichbar',
      metadata: {
        defaultBranch: data.default_branch,
        visibility: data.visibility,
        archived: Boolean(data.archived),
        pushedAt: data.pushed_at,
        sizeKb: data.size
      }
    };
  }
};
