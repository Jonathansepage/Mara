# Mara

Contains API specs located under `api` directory, and front-end application 
located under `app`.

### API Documentation

The `routes` file is a collection of all the usable endpoints of the API. All
calls should accept JSON as the primary format and return JSON in their body
response when needed.

Scores (including `score` and `matching` fields) are always integers scaled on
a range from 1 to 100.
