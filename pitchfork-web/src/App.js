import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, Switch, Route } from 'react-router-dom';
import { get } from 'superagent';


function Steps(props) {
  return <div>
    <b>Preparation</b>
    <div> Ready in: {props.readyInMinutes}min </div>
    <div> Preparation: {props.preparationMinutes}min </div>
    <div> Cooking: {props.cookingMinutes}min </div>
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
      <b>Ingredients</b>
      <ul>
        {props.extendedIngredients.map( (x, id) =>
          <li key={id}>{x.originalString} </li>
        )}
      </ul>
    </div>
  );
}

function Nutrition (props) {
  return (
    <div>
      <table>
        <thead>
          <tr><th>Nutrition</th> <td>Amount</td> <td>RDA</td> </tr>
        </thead>
        <tbody>
          {props
            .nutrition
            .nutrients
            .sort((a,b) => b.amount - a.amount)
            .map( ({title, amount, unit, percentOfDailyNeeds}, key)=>
              <tr key={key}>
                  <td>{title}</td>
                  <td>{amount}{unit}</td>
                  <td>{percentOfDailyNeeds}%</td>
              </tr>
          )}
        </tbody>
      </table>
      <ul>
        <li> Protein: {props.nutrition.caloricBreakdown.percentProtein}% </li>
        <li> Fat: {props.nutrition.caloricBreakdown.percentFat}% </li>
        <li> Carbs: {props.nutrition.caloricBreakdown.percentCarbs}% </li>
      </ul>
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
        <div className="info">

          <div className="meta">
            <span title="Ready in">
            &#8986;{data.readyInMinutes}mins
            </span>

            <span title="servings">
              &#127869; {data.servings}
            </span>
          </div>
        </div>

        <div className="title">{data.title}</div>

        <Link to={name} className="image">
          <img src={data.image} />
        </Link>

        <a href={data.sourceUrl} className="source">{
          data.sourceUrl
            .replace(/https?:\/\//, '')
            .split('/')
            .find(x => x)
        }</a>

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

  return (
    <>
      <img src={data.image} />
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

function App() {
  const recipes = Array
    .from({length:20}, () => Math.floor(Math.random() * 1000))
    .map(i => `keto-${i}`);


  return (
    <>
      <div className="Navigation">
        <Link to="/"> FoodWall </Link>
      </div>
      <Switch>
        <Route exact path="/">
          <div className="grid">{
            recipes.map( (name, key) => <RecipeCard name={name} key={key} />)
          }</div>
        </Route>
        <Route path="/:id" component={Recipe}  />
      </Switch>
    </>
  )
}

export default App;
