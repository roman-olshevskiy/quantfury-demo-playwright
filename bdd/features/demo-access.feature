@ui @live @smoke
Feature: Demo access
  A visitor can explore the trading screen without creating an account,
  while actions that need an account stay unavailable.

  Scenario: A visitor enters the demo without an account
    Given a visitor opens the Quantfury demo
    Then the watchlist is available
    And the portfolio and limit orders require an account
