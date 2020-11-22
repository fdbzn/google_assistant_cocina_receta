app.askWithList(app.buildRichResponse()
  .addSimpleResponse('hola'+request.body.sessionId)
  .addSuggestions(
    ['Basic Card', 'List', 'Carousel', 'Suggestions']),
  // Build a list
  app.buildList('Things to learn about')
  // Add the first item to the list
  .addItems(app.buildOptionItem('MATH_AND_PRIME',
    ['math', 'math and prime', 'prime numbers', 'prime'])
    .setTitle('Math & prime numbers')
    .setDescription('42 is an abundant number because the sum of its ' +
      'proper divisors 54 is greater…')
    .setImage('http://example.com/math_and_prime.jpg', 'Math & prime numbers'))
  // Add the second item to the list
  .addItems(app.buildOptionItem('EGYPT',
    ['religion', 'egpyt', 'ancient egyptian'])
    .setTitle('Ancient Egyptian religion')
    .setDescription('42 gods who ruled on the fate of the dead in the ' +
      'afterworld. Throughout the under…')
    .setImage('http://example.com/egypt', 'Egypt')
  )
  // Add third item to the list
  .addItems(app.buildOptionItem('RECIPES',
    ['recipes', 'recipe', '42 recipes'])
    .setTitle('42 recipes with 42 ingredients')
    .setDescription('Here\'s a beautifully simple recipe that\'s full ' +
      'of flavor! All you need is some ginger and…')
    .setImage('http://example.com/recipe', 'Recipe')
  )
);
