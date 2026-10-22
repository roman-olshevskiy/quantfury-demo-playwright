# Architecture decision records

Each record explains a decision, the alternatives and the consequences.

| ADR                                                          | Decision                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [0001](0001-github-hosted-ci-gates-api-only.md)              | CI on GitHub-hosted runners gates on static checks and the live API suite; UI suites are a scheduled signal |
| [0002](0002-apirequestcontext-with-a-recording-transport.md) | Playwright `APIRequestContext` with a thin recording transport for HTTP tests                               |
| [0003](0003-fixture-scopes-isolation-and-parallelism.md)     | Fixture scopes, test isolation and parallelism limits                                                       |
| [0004](0004-live-and-mocked-suites.md)                       | Separate live and mocked suites; narrow, schema-validated mocks                                             |
| [0005](0005-abort-third-party-requests.md)                   | Abort third-party requests in UI tests                                                                      |
| [0006](0006-bdd-scope.md)                                    | A small BDD suite for communication, built on the existing framework                                        |
| [0007](0007-realtime-hub-envelope-decoding.md)               | Decode the real-time hub envelope; inject disconnects through a local proxy                                 |

A new decision gets the next number and the same sections: context, decision, alternatives
considered, consequences. A changed decision gets a new record that supersedes the old one.
