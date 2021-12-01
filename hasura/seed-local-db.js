/* eslint-disable */
const fetch = require('node-fetch');
const gql = require('fake-tag');

const PRODUCTION_GRAPHQL_URL = (
  process.env.PRODUCTION_GRAPHQL_URL
  || 'https://api.metagame.wtf/v1/graphql'
);
const LOCAL_GRAPHQL_URL = (
  process.env.LOCAL_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'
);
const LOCAL_BACKEND_ACCOUNT_MIGRATION_URL = (
  process.env.LOCAL_BACKEND_ACCOUNT_MIGRATION_URL
  || 'http://localhost:4000/actions/migrateSourceCredAccounts?force=true'
);
const HASURA_GRAPHQL_ADMIN_SECRET = (
  process.env.HASURA_GRAPHQL_ADMIN_SECRET || 'metagame_secret'
);
const NUM_PLAYERS = process.env.SEED_NUM_PLAYERS || 300;

const authHeaders = {
  'content-type': 'application/json',
  'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET,
}

async function fetchGraphQL(
  url, operationsDoc, operationName, variables = {}, isUpdate = false
) {
  const result = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
    headers: isUpdate ? authHeaders : undefined,
  });

  return await result.json();
}

const topPlayersQuery = gql`
  query GetTopPlayers {
    player(
      limit: ${NUM_PLAYERS}
      order_by: { total_xp: desc }
      where: {
        availableHours: { _gte: 0 }
        timezone: { _in: null }
        type: { id: { _in: null } }
        skills: { Skill: { id: { _in: null } } }
      }
    ) {
      id
      username
      ethereumAddress
      availableHours
      timezone
      colorMask
      type {
        id
      }
      skills {
        Skill {
          id
          category
          name
        }
      }
    }
  }
`;

async function fetchTopPlayers() {
  const { errors, data } = await fetchGraphQL(
    PRODUCTION_GRAPHQL_URL,
    topPlayersQuery,
    'GetTopPlayers',
  );

  if (errors) {
    // handle those errors like a pro
    errors.map((e) => {
      throw e;
    });
  }

  return data.player;
}

const getPlayerIdsAndSkillsQuery = gql`
  query GetPlayerIds($addresses: [String!]) {
    player(where: { ethereumAddress: { _in: $addresses } }) {
      id
      ethereumAddress
    }
    skill {
      id
      category
      name
    }
  }
`;

async function fetchPlayerIdsAndSkills(addresses) {
  const { errors, data } = await fetchGraphQL(
    LOCAL_GRAPHQL_URL,
    getPlayerIdsAndSkillsQuery,
    'GetPlayerIds',
    { addresses },
  );

  if (errors?.length > 0) {
    throw errors[0]
  }

  const ids = Object.fromEntries(
    data.player.map(({ id, ethereumAddress }) => (
      [ethereumAddress, id]
    ))
  );
  return { ids, skills: data.skill };
}

const deleteSkillsMutation = gql`
  mutation DeleteSkills {
    delete_player_skill(where: {}) {
      affected_rows
    }
  }
`;

async function deleteSkills() {
  const { errors } = await fetchGraphQL(
    LOCAL_GRAPHQL_URL,
    deleteSkillsMutation,
    'DeleteSkills',
    {},
    true,
  );

  if (errors) {
    // handle those errors like a pro
    errors.map((e) => {
      throw e;
    });
  }
}

const updatePlayerMutation = gql`
  mutation UpdatePlayer(
    $playerId: uuid!
    $availability: Int
    $timezone: String
    $playerTypeId: Int
    $colorMask: Int
    $username: String
    $skills: [player_skill_insert_input!]!
  ) {
    insert_player_skill(objects: $skills) {
      affected_rows
    }
    update_player_by_pk(
      pk_columns: { id: $playerId }
      _set: {
        player_type_id: $playerTypeId
        timezone: $timezone
        availability_hours: $availability
        colorMask: $colorMask
        username: $username
      }
    ) {
      id
      username
      ethereum_address
      availability_hours
      timezone
      colorMask
      type {
        id
      }
      skills {
        Skill {
          id
        }
      }
    }
  }
`;

async function updatePlayer(variables) {
  const { errors, data } = await fetchGraphQL(
    LOCAL_GRAPHQL_URL,
    updatePlayerMutation,
    'UpdatePlayer',
    variables,
    true,
  );

  if (errors?.length > 0) {
    throw errors[0]
  }

  return data.update_player_by_pk;
}

const skillsMap = {};

function getSkillId(skills, { Skill: { category, name } }) {
  const skillMapId = category + name;
  if (!skillsMap[skillMapId]) {
    skills.forEach((skill) => {
      skillsMap[skill.category + skill.name] = skill.id;
    });
  }
  return skillsMap[skillMapId];
}

async function forceMigrateAccounts() {
  const result = await fetch(LOCAL_BACKEND_ACCOUNT_MIGRATION_URL, {
    method: 'POST',
  });
  return await result.json();
}

async function startSeeding() {
  console.debug(`Force migrating sourcecred users into local db`);
  const result = await forceMigrateAccounts();
  console.debug(result);
  console.debug(`Fetching players from prod db`);
  const players = await fetchTopPlayers();
  const addresses = players.map(({ ethereumAddress }) => ethereumAddress);
  console.debug(`Fetching player ids for players from local db`);
  const { ids, skills } = await fetchPlayerIdsAndSkills(addresses);
  const mutations = (
    players.map((player) => {
      const id = ids[player.ethereumAddress];
      if (!id) return undefined;
      return {
        playerId: id,
        availability: player.availableHours,
        timezone: player.timeZone,
        playerTypeId: player.type.id,
        colorMask: player.colorMask ?? null,
        username: player.username,
        skills: (
          player.skills.map((skill) => ({
            skill_id: getSkillId(skills, skill),
            player_id: id,
          }))
        ),
      };
    })
    .filter(m => !!m)
  );
  console.debug(
    `Updating player information in local db for players in prod db`,
  );
  await deleteSkills();
  const updated = await Promise.all(mutations.map(
    (mutation) => updatePlayer(mutation)
  ));
  console.debug(`Successfully seeded local db with ${updated.length} players`);
}

startSeeding()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
