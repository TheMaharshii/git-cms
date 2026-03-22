/**
 * GitHub API Helper
 * Handles all communication with GitHub REST API for managing data.json
 */

class GitHubAPI {
  constructor(owner, repo, branch = 'main', token = null) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = token;
    this.apiBase = 'https://api.github.com';
    this.fileePath = 'data.json';
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return headers;
  }

  /**
   * Decode base64 string
   */
  decodeBase64(str) {
    try {
      return decodeURIComponent(atob(str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      throw new Error('Failed to decode base64 content');
    }
  }

  /**
   * Encode string to base64
   */
  encodeBase64(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      throw new Error('Failed to encode to base64');
    }
  }

  /**
   * Fetch the data.json file from GitHub
   * Returns: { content, sha, data }
   */
  async fetchData() {
    try {
      const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.fileePath}?ref=${this.branch}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized: Invalid token or insufficient permissions');
      }

      if (response.status === 404) {
        throw new Error('File not found: data.json does not exist in the repository');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      const responseData = await response.json();
      
      // Decode content from base64
      const decodedContent = this.decodeBase64(responseData.content);
      const jsonData = JSON.parse(decodedContent);

      return {
        content: decodedContent,
        sha: responseData.sha,
        data: jsonData,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update the data.json file in GitHub
   */
  async updateData(newData, commitMessage = 'Update data via CMS') {
    try {
      // First fetch current version to get SHA and content
      const current = await this.fetchData();

      // Convert new data to JSON string
      const newContent = JSON.stringify(newData, null, 2);

      // Encode to base64
      const encodedContent = this.encodeBase64(newContent);

      const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.fileePath}`;

      const payload = {
        message: commitMessage,
        content: encodedContent,
        sha: current.sha,
        branch: this.branch,
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error('❌ Token is invalid or expired. Generate a new one: https://github.com/settings/tokens');
      }

      if (response.status === 403) {
        const errorData = await response.json();
        throw new Error('❌ forbidden: Your token lacks write permissions. Ensure it has "repo" scope. Generate a new token: https://github.com/settings/tokens');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`❌ Update failed: ${error.message || response.statusText}. Check token scope and repository access.`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        sha: responseData.content.sha,
        message: 'File updated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate repository exists and is accessible
   */
  async validateRepository() {
    try {
      const url = `${this.apiBase}/repos/${this.owner}/${this.repo}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized: Invalid token or insufficient permissions');
      }

      if (response.status === 404) {
        throw new Error('Repository not found');
      }

      if (!response.ok) {
        throw new Error(`Failed to validate repository: ${response.statusText}`);
      }

      const repoData = await response.json();
      return {
        success: true,
        repo: repoData.name,
        owner: repoData.owner.login,
      };
    } catch (error) {
      throw error;
    }
  }
}
