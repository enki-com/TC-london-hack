import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

let count = 0;


// http://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer
function isNormalInteger(str) {
    var n = ~~Number(str);
    return String(n) === str && n >= 0;
}

function sanitize(name) {
  return name.replace(/\./g, '_').replace(/\//g, '_');
}

function schemaFromArrayOfObjects(name, data) {
  var firstRow = data[0];
  var fieldsFromData = {};
  // inferring types (Int or String) from first row
  Object.keys(firstRow).forEach(fieldName => {
    var val = firstRow[fieldName];
    fieldsFromData[fieldName] = {
      type: isNormalInteger(val) ? GraphQLInt : GraphQLString,
      description: 'Example value: ' + val,
      resolve: (row) => {
        console.log('resolving ', row, fieldName);
        return row[fieldName];
      }
    }
  });
  return new GraphQLObjectType({
    name: sanitize(name),
    fields: () => {
      return fieldsFromData;
    },
  });
}

function schemaFromSpreadSheet(name, obj) {
  var fieldsFromData = {};
  var connectionToFields = {};
  Object.keys(obj).forEach(sheetName => {
    var sheetSchema = schemaFromArrayOfObjects(sheetName, obj[sheetName]);
    var {connectionType} = connectionDefinitions({name: sheetName + 'ConnectionType', nodeType: sheetSchema});
    fieldsFromData[sheetName] = {
      type: sheetSchema,
      description: sheetName + ' sheet',
      args: {
        row: {
          type: GraphQLInt,
        },
      },
      resolve: (root, {row}) => {
        return obj[sheetName][row];
      },
    }
    fieldsFromData[sheetName + 's'] = {
      type: connectionType,
      description: '',
      args: connectionArgs,
      resolve: (root, args) => connectionFromArray(
        obj[sheetName],
        args
      ),
    }
  });
  let ot = new GraphQLObjectType({
    name: sanitize(name),
    description: 'File ' + name,
    fields: () => fieldsFromData,
  });
  return new GraphQLSchema({
    query: ot
  });
}

module.exports.schemaFromSpreadSheet = schemaFromSpreadSheet;
