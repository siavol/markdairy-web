import { ActionFunctionArgs } from 'react-router-dom'
import { exchangeCodeToAccessToken } from '../../services/github'
import { saveGitHubToken } from '../../services/config-storage'

export class GitHubAppAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly description: string
  ) {
    super(message)

    this.name = this.constructor.name

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export type TokenGeneratedStatus = 'ok'

export async function githubAppTokenLoader(
  args: ActionFunctionArgs
): Promise<TokenGeneratedStatus> {
  const url = new URL(args.request.url)
  const params = new URLSearchParams(url.search)

  const error = params.get('error')
  if (error) {
    throw new GitHubAppAuthError(
      'Error in GitHub App callback',
      error,
      params.get('error_description') || ''
    )
  }

  const code = params.get('code')
  if (!code) {
    throw new GitHubAppAuthError(
      'No GitHub code in callback',
      'no_github_code',
      ''
    )
  }

  const tokenData = await exchangeCodeToAccessToken(code)
  saveGitHubToken(tokenData.access_token)

  console.log('Token saved!')
  return 'ok'
}