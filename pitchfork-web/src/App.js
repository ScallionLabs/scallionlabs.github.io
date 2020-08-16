import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, Switch, Route, useLocation } from 'react-router-dom';
import { get } from 'superagent';
import RadarChart from 'react-svg-radar-chart';
import 'react-svg-radar-chart/build/css/index.css';


function Steps(props) {
  return <div>
    <h2>Preparation</h2>
    {
      props.analyzedInstructions.map(x =>
        <div>
          <b>{x.name}</b>
          <ul>
            {x.steps.map( ({step}, i) => <li key={i}>{step}</li> )}
          </ul>
        </div>
      )
    }
  </div>
}

function Ingredients (props) {
  return (
    <div>
      <h2>Ingredients</h2>
      <ul>
        {props.extendedIngredients.map( (x, id) =>
          <li key={id}>{x.originalString} </li>
        )}
      </ul>
    </div>
  );
}


const Radar = ({title, data}) => (
  <RadarChart
    options = {{size:'33%', scales:5}}
    title = {title}
    captions = {
      data
        .map(x=>x.title)
        .reduce((a,b)=> ({[b]:b, ...a}), {})
    }
    data = {[{
      meta: {color: 'orange'},
      data: data
        .reduce((a,b) => ({[b.title]: Math.min(1,b.value/100), ...a}), {})}]
    } />
);


function MacroBreakdown({caloricBreakdown, nutrients}) {
  const {percentProtein, percentFat, percentCarbs} = caloricBreakdown

  const carbs = nutrients.find(x => x.title == 'Net Carbohydrates') || {amount: 0};
  const fiber = nutrients.find(x => x.title == 'Fiber') || {amount: 0};
  const sugar = nutrients.find(x => x.title == 'Sugar') || {amount: 0};
  const protein = nutrients.find(x => x.title == 'Protein') || {amount: 0};
  const fat = nutrients.find(x => x.title == 'Fat') || {amount: 0};
  const saturated = nutrients.find(x => x.title == 'Saturated Fat') || {amount: 0};


  const saturatedPercent = percentFat * saturated.amount / fat.amount;
  const unsaturatedPercent = percentFat * (1 - saturated.amount / fat.amount);
  const fiberPercent = percentCarbs * fiber.amount / carbs.amount
  const sugarPercent = percentCarbs * sugar.amount  / carbs.amount
  const complexPercent = percentCarbs * (carbs.amount - sugar.amount)  / carbs.amount

  const data = [
    {title: "Unsaturated Fat", value: unsaturatedPercent, color: "black"},
    {title: "Saturated Fat", value: saturatedPercent, color: "darkgrey"},
    {title: "Protein", value: percentProtein, color: "blue"},
    {title: "Fiber", value: fiberPercent, color: "green"},
    {title: "Sugar", value: sugarPercent, color: "red"},
    {title: "Complex Carbs", value: complexPercent, color: "orange"},
  ];

  const scale = Math.max(...data.map(x=>x.value));
  const scaled = data.map(x=>({...x, value: x.value/scale * 100}));

  return <Radar title="Macros" data={scaled} />
}

const summaryExcludes = new Set([
  'Net Carbohydrates',
  'Cholesterol',
]);

function Nutrition (props) {
  const excludes = new Set([
    'Carbohydrates',
    'Net Carbohydrates',
    'Fat',
    'Sugar',
    'Fiber',
    'Calories',
    'Saturated Fat',
    'Cholesterol',
    'Protein',
    'Folate'
  ]);

  const nutrients = props
    .nutrition
    .nutrients
    .filter(x=>!excludes.has(x.title))
    .sort((a,b) => a.title.localeCompare(b.title) )

  const vitamins = nutrients
    .filter(x => x.title.includes('Vitamin'))
    .map(x=>({...x, value: Math.min(100, x.percentOfDailyNeeds)}));

  const minerals = nutrients
    .filter(x => !x.title.includes('Vitamin') )
    .map(x=>({...x, value: Math.min(100, x.percentOfDailyNeeds)}));

  return (
    <div className="Nutrition">
      <div>
        <h2>Vitamins RDA %</h2>
        <Radar title="Vitamins" data={vitamins} />
      </div>
      <div>
        <h2>Minerals RDA %</h2>
        <Radar title="Minerals" data={minerals} />
      </div>
      <div>
        <h2>Macros</h2>
        <MacroBreakdown {...props.nutrition} />
      </div>
    </div>
  );
}

function RecipeCard({name}) {
  const [data, setData] = useState(null);

  useEffect(() => {
    get(`./data/${name}.json`).then(x=>setData(x.body));
  }, [name]);

  if (!data) return null;

  return (
      <div className="card" >
        <Link to={name} className="image">
          <img src={data.image} />
        </Link>

        <div className="meta">
          <div className="source">{
            data.creditsText
          }</div>
          <div className="title">{data.title}</div>
        </div>


      </div>
  );
}

function Recipe({match}) {
  const [data, setData] = useState(null);

  useEffect(() => {
    get(`./data/${match.params.id}.json`).then(x=>setData(x.body));
  }, [match.params.id]);

  if (!data)
    return null;

  const recipes = Array
    .from({length:3}, (_, i) => Math.floor(Math.random() * 1000))
    .map(i => `keto-${i}`);



  const additionalTags = [
    data.veryPopular && 'popular',
    data.veryHealthy && 'very healthy',
  ].filter(x=>x);

  const top5Nutrients = data
    .nutrition
    .nutrients
    .filter( x => !summaryExcludes.has(x.title))
    .filter( x => x.percentOfDailyNeeds > 100)
    .sort( (a,b) => b.percentOfDailyNeeds - a.percentOfDailyNeeds)
    .slice(0, 5);

    console.log(data);
  return (
    <>
      <div className="header">
        <div  style={{padding: '1em'}}>
          <img src={data.image}/>
        </div>
        <div>
          <h1>{data.title}</h1>
          <ul className="summaryList">
            <li> <a href={data.sourceUrl}>{data.sourceUrl}</a> </li>
            <li> Servings: <b>{data.servings}</b></li>
            <li> Ready in: <b>{data.readyInMinutes}</b>min </li>
            {data.preparationMinutes &&
              <li> Preparation time: <b>{data.preparationMinutes}</b>min </li> }
            {data.cookingMinutes &&
              <li> Cooking time: <b>{data.cookingMinutes}</b>min </li> }
            <li> Tags: {
              data.dishTypes
                .concat(data.diets)
                .concat(additionalTags)
                .map( x => <span key={x} className="tag">{x} </span> )
            }</li>

            <li>High in: {top5Nutrients.map(x => <span key={x.title} className="tag">{x.title.replace('Vitamin ', '')} </span> )} </li>

          </ul>
        </div>
      </div>
      <Nutrition {...data} />
      <Ingredients {...data} />
      <div>
        <Steps {...data} />
      </div>

      <div className="similar">
        <h1> Similar Recipes </h1>
        <div className="grid">{
          recipes.map( (name, key) => <RecipeCard name={name} key={key} />)
        }</div>
      </div>

    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const recipes = Array
    .from({length:20}, () => Math.floor(Math.random() * 1000))
    .map(i => `keto-${i}`);


  return (
    <>
      <ScrollToTop/>
      <div className="Navigation">
        <Link to="/"> FoodWall </Link>
      </div>
      <Switch>
        <Route exact path="/">
          <div className="banner">
            <div className="tagline">
              <p>
                Be the Hero of the next Dinner
              </p>
              <p>
                Discover new Recipes and their Nutrition Value
              </p>
            </div>
            <div className="copic">
              <img src="images/platter-1932466_1920.jpg" />
            </div>
          </div>
{/*
          <div className="section videos">
            <h2>Featured Videos</h2>
            <div className="grid">
              <iframe width="300" height="300"  src="https://www.youtube.com/embed/zrRDnLJdjmQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              <iframe width="300" height="300"  src="https://www.youtube.com/embed/zrRDnLJdjmQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              <iframe width="300" height="300"  src="https://www.youtube.com/embed/zrRDnLJdjmQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              <iframe width="300" height="300"  src="https://www.youtube.com/embed/zrRDnLJdjmQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>
*/}
          <div className="section">
            <h2> Recipe Wall </h2>
            <div className="grid">
              {
              recipes.map( (name, key) => <RecipeCard name={name} key={key} />)
            }</div>

          </div>

        </Route>
        <Route path="/:id" component={Recipe}  />
      </Switch>
    </>
  )
}

export default App;
