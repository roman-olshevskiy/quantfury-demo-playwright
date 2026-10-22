@ui @live @regression
Feature: Market momentum
  The momentum widget lists the strongest gainers and losers of the day.

  Scenario: Top losers are a different list from top gainers
    Given a visitor opens the Quantfury demo
    And the momentum widget shows the top gainers
    When they switch the momentum widget to the top losers
    Then no instrument is listed both as a gainer and as a loser
