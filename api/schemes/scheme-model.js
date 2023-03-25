const /** @type {import('knex').Knex}*/ db = require('../../data/db-config');

async function find() {
  // EXERCISE A
  /*
    1A- Study the SQL query below running it in SQLite Studio against `data/schemes.db3`.
    What happens if we change from a LEFT join to an INNER join?

      SELECT
          sc.*,
          count(st.step_id) as number_of_steps
      FROM schemes as sc
      LEFT JOIN steps as st
          ON sc.scheme_id = st.scheme_id
      GROUP BY sc.scheme_id
      ORDER BY sc.scheme_id ASC;

    2A- When you have a grasp on the query go ahead and build it in Knex.
    Return from this function the resulting dataset.
  */
  /**
    select
      sc.scheme_id, scheme_name, count(st.step_id) as step_count
    from schemes as sc
    join steps as st
    where sc.scheme_id = st.scheme_id
    group by sc.scheme_id
     */

  const result = await db('schemes as sc')
    .leftJoin('steps as st', 'sc.scheme_id', '=', 'st.scheme_id')
    .groupBy('sc.scheme_id')
    .orderBy('sc.scheme_id', 'asc')
    .select('sc.scheme_id', 'scheme_name', db.raw('count(st.step_id) as number_of_steps'));

  return result;
}

async function getById(scheme_id) {
  const result = await db('schemes').where({ scheme_id }).first();
  return result;
}

async function findById(scheme_id) {
  /**
   * select * from schemes as sc
join steps as st
where sc.scheme_id = st.scheme_id and sc.scheme_id = 1

   */
  try {
    const [{ scheme_id: id, scheme_name, ...steps }, ...rest] = await db('schemes as sc')
      .where('sc.scheme_id', scheme_id)
      .leftJoin('steps as st', 'sc.scheme_id', '=', 'st.scheme_id')
      .select('sc.scheme_id', 'scheme_name', 'st.step_id', 'step_number', 'instructions')
      .orderBy('step_number', 'asc');

    const result = rest.reduce(
      //eslint-disable-next-line
      (acc, { scheme_id: unused, scheme_name: unusedName, ...curr }) => {
        if (curr) {
          return { ...acc, steps: [...acc.steps, curr] };
        }
        return { ...acc };
      },
      { scheme_id: id, scheme_name, steps: Object.values(steps).some((props) => !props) ? [] : [{ ...steps }] }
    );
    return result;
  } catch (err) {
    console.log(`something went wrong in findById(${scheme_id})`);
    console.log(err);
  }
}

async function findSteps(scheme_id) {
  // EXERCISE C
  /*
    1C- Build a query in Knex that returns the following data.
    The steps should be sorted by step_number, and the array
    should be empty if there are no steps for the scheme:

      [
        {
          "step_id": 5,
          "step_number": 1,
          "instructions": "collect all the sheep in Scotland",
          "scheme_name": "Get Rich Quick"
        },
        {
          "step_id": 4,
          "step_number": 2,
          "instructions": "profit",
          "scheme_name": "Get Rich Quick"
        }
      ]
  */

  const result = await db('steps')
    .where('steps.scheme_id', scheme_id)
    .join('schemes', 'schemes.scheme_id', '=', 'steps.scheme_id')
    .select('step_id', 'step_number', 'instructions', 'scheme_name')
    .orderBy('step_number', 'asc');
  return result;
}

function add(scheme) {
  // EXERCISE D
  /*
    1D- This function creates a new scheme and resolves to _the newly created scheme_.
  */
  return db('schemes')
    .insert(scheme)
    .then((ids) => {
      return getById(ids[0]);
    });
}

function addStep(scheme_id, step) {
  // EXERCISE E
  /*
    1E- This function adds a step to the scheme with the given `scheme_id`
    and resolves to _all the steps_ belonging to the given `scheme_id`,
    including the newly created one.
  */
  return db('steps')
    .insert({ ...step, scheme_id })
    .then(() => {
      return findSteps(scheme_id);
    });
}

module.exports = {
  find,
  getById,
  findById,
  findSteps,
  add,
  addStep,
};
