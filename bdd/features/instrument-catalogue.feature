@api @live @regression
Feature: Instrument catalogue
  Every visitor gets the same, consistent catalogue of tradable instruments.

  Scenario: The catalogue is complete and consistent
    Given a new demo visitor
    When the full instrument catalogue is requested
    Then every instrument has a unique short name
    And every popular instrument is part of the catalogue
