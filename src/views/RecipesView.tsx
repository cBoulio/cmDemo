import React from "react";
import { useNavigate } from "react-router-dom";
import NutrientItem from "../components/NutrientItem";
import getRecipes from "../api/getRecipes";
import getUser from "../api/getUser";
import trophyIcon from "../assets/trophy.svg";
import "./RecipesView.css";
import { recipeObject } from "../types/recipe.type";

const RecipesView = () => {
  const navigate = useNavigate();
  type t = {
    beans: string
  }
  // This needs to be broken up into individual state
  // ex: const [isFiltered, setIsFiltered] = React.useState(false)
  const [state, setState] = React.useState({
    isFiltered: false,
    recipes: [],
    filteredRecipes: [],
    error: false,
  });

  
  const [user, setUser] = React.useState({units: undefined,language: undefined})

  const getEnergy = React.useCallback((recipeUnit: string, value: any) => {
    let label;
    let recipeUnits = recipeUnit ? recipeUnit : undefined 
    let userUnits = user.units ? user.units : undefined

    if (recipeUnits !== userUnits) {
      if (recipeUnit === 'kilojoule') {
        label = 'kCal'
        value = value / 4.184;
      }
      else {
        label = 'kJ';
        value = value * 4.184;
      }
    }
    else {
      if (recipeUnit === 'kilojoule') {
        label = 'kJ'
      }
      else {
        label = 'kCal'
      }
    }

    return {
      label,
      value,
    };
  }, [user]);

  const filterRecipes = React.useCallback((value: string) => {
    setState({
      ...state,
      isFiltered: value !== '',
      // @ts-ignore
      filteredRecipes: state.recipes.filter(({ name }) => name.includes(value))
    });
  }, [setState, state]);

  const round = React.useCallback((num: number, decimalPlaces = 2) => {
    const p = Math.pow(10, decimalPlaces);
    return Math.round(num * p) / p;
  }, []);

  const goToSingleRecipe = React.useCallback((id: string) => {
    navigate(`/recipe/${id}`, { replace: true });
  }, [navigate]);

  // Fetch view data on mount
  React.useEffect(() => {
    const fetchRecipesData = async() => {
      try {
        const recipes = await getRecipes();
        const user = await getUser();

        if (!recipes.length) {
          setState({
            ...state, error: true,
          });
        } else {
          // TODO: sanitize recipes and set default language first
          // something like user.language
          setState({
            ...state, recipes,
          });
          
          setUser(user)

        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchRecipesData();
  }, [setState, state])

  // TODO: create language converter function --> Move it into a utils folder as we'll be 
  // using it in several parts of the app

  // function convertLanguage(text:string){
  // get user.language and return text converted to that language  
  //}

  const recipeList = state.isFiltered ? state.filteredRecipes : state.recipes;
  return (
    <div className="recipes">
      {!state.error && (
        <>
          <input
            placeholder="Search foods and servings&hellip;"
            className="search"
            type="text"
            onInput={({ target }: any) => filterRecipes(target.value)}
          />  
          <div className="list">
          {recipeList.map((recipe: recipeObject, index) => (
            <div key={index} className="recipe-item" onClick={() => goToSingleRecipe(recipe.id)}>
              <div className="recipe-name">
                { recipe.name }
              </div>
              <img className="recipeImage" src={recipe.image} />
              <div className="nutrients">
                {Object.keys(recipe.nutrients).map((nutrientName) => {
                  const { value, unit } = recipe.nutrients[nutrientName];
                  return (
                    <React.Fragment key={value}>
                      {nutrientName === 'carbs' && (
                        <NutrientItem
                          name={index === 0 ? 'Carbs' : null}
                          value={value + 'g'}
                          className="carbs"
                          />
                      )}
                      {nutrientName === 'proteins' && (
                        <NutrientItem
                          name={index === 0 ? 'Protein' : null}
                          value={value + 'g'}
                          className="protein"
                          />
                      )}
                      {nutrientName === 'fats' && (
                        <NutrientItem
                          name={index === 0 ? 'Fat' : null}
                          value={value + 'g'}
                          className="fat"
                          />
                      )}
                      {nutrientName === 'energy' && (
                        <NutrientItem
                          name={index === 0 ? getEnergy(unit, value).label : null}
                          value={round(getEnergy(unit, value).value)}
                          className="energy"
                          />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="tags">
                {recipe.isPremium && (
                  <div className="tag premium">
                    <img className="trophy" src={trophyIcon} />
                    Premium
                  </div>
                )}
                {recipe.tags && recipe.tags.map((tag => (
                  <div className="tag" key={tag}>
                    { tag }
                  </div>
                )))}
              </div>
            </div>
          ))}
          </div>
        </>
      )}
      {!recipeList.length && <div>Unable to load recipes</div>}
    </div>
  );
}

export default RecipesView;
