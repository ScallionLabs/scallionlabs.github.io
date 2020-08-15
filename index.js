const { get } = require('superagent');
const { readFile, readJson, writeJson, writeFile, exists } = require('fs-extra');
const mkdirp = require('mkdirp');


const apiKey='53d2148bcec643beab2e9a6e61bf3e40';
const getRecipes = async ({diet, offset}) => {
  if (await exists(`cache/${diet}-${offset}.json`)) {
    return readJson(`cache/${diet}-${offset}.json`);
  }
  const query = {
    apiKey,
    diet,
    fillIngredients: true,
    addRecipeInformation: true,
    addRecipeNutrition: true,
    offset
  };

  await mkdirp('cache');

  const {body} = await get(`https://api.spoonacular.com/recipes/complexSearch`)
      .query(query);

  await writeJson(`cache/${diet}-${offset}.json`, body);
  return body;
}

const getImage = async (url, name) => {
  if (await exists(name)) {
    return await readFile(name);
  }

  const headers = {
    'sec-ch-ua': 'Google Chrome 80',
    'Referer': 'https://localhost:1337',
    'Sec-Fetch-Dest': 'image',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
  };

  const { body } = await get(url)
    .set(headers);

  return await writeFile(name, body);
}

const publicImage = (x, i, j) => `images/Ketogenic-${i * 10 +j}.${x.imageType}`;

async function main() {
  await mkdirp('images/ketogenic');
  for (let i = 0; i < 200; ++i) {
    const {results} = await getRecipes({diet:'Ketogenic', offset:i *10});
    const images = results.map((x, j) => [x.image, publicImage(x, i, j)]);
    const recipes = results.map( (x, j) => ({
      ...x,
      id: `keto-${i * 10 + j}`,
      image: publicImage(x, i, j),
      summary: undefined
    }));

    await mkdirp(`pitchfork-web/src/data/ketogenic`);
    for (const recipe of recipes) {
      await writeJson(`pitchfork-web/src/data/${recipe.id}.json`, recipe);
    }

    for (const [url, name] of images) {
      await getImage(url, `pitchfork-web/public/${name}`);
    }
  }
}

main();