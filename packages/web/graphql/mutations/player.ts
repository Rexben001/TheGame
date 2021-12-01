import gql from 'fake-tag';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
gql`
  mutation UpdatePlayerUsername($playerId: uuid!, $username: String!) {
    update_player_by_pk(
      pk_columns: { id: $playerId }
      _set: { username: $username }
    ) {
      id
      username
    }
  }

  mutation UpdateProfile($playerId: uuid!, $input: player_set_input!) {
    update_player_by_pk(pk_columns: { id: $playerId }, _set: $input) {
      id
      availableHours
      timeZone
    }
  }

  mutation UpdateAboutYou($playerId: uuid!, $input: player_set_input!) {
    update_player_by_pk(pk_columns: { id: $playerId }, _set: $input) {
      id
      colorMask
      type {
        id
        description
        imageURL
        title
      }
    }
  }

  mutation UpdatePlayerSkills($skills: [player_skill_insert_input!]!) {
    delete_player_skill(where: {}) {
      affected_rows
    }
    insert_player_skill(objects: $skills) {
      affected_rows
    }
  }

  mutation UpdatePlayerRoles($roles: [player_role_insert_input!]!) {
    delete_player_role(where: {}) {
      affected_rows
    }
    insert_player_role(objects: $roles) {
      affected_rows
    }
  }

  mutation UpdatePlayerProfileLayout($playerId: uuid!, $layout: String!) {
    update_player_by_pk(
      pk_columns: { id: $playerId }
      _set: { profile_layout: $layout }
    ) {
      id
      profile_layout
    }
  }
`;

export const UpdateProfilePronouns = gql`
  mutation updateProfilePronouns($playerId: uuid!, $input: player_set_input!) {
    update_player_by_pk(pk_columns: { id: $playerId }, _set: $input) {
      id
    }
  }
`;
