@ui @live @regression
Feature: Instrument search
  A visitor finds instruments by name and inspects their details.

  Background:
    Given a visitor opens the Quantfury demo

  Scenario: Find a company by name and inspect it
    When they search for "Apple"
    And they open the result "AAPL.OQ"
    Then the instrument panel shows "Apple Inc." with a last price

  Scenario: An unknown search term suggests popular instruments
    When they search for "zzqxw"
    Then they are told that nothing matched "zzqxw"
    And popular instruments are suggested instead
