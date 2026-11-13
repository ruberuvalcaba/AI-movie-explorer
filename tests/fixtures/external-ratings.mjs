export function externalRatingsFixture(id) {
 if (id === 920002 || id === 930002) return { ratings: [] };
 if (id === 920003) return { ratings: ['imdb','tomatoes','popcorn','metacritic'].map(source=>({source,value:0,votes:0})) };
 if (id === 920004) return { ratings: [{source:'tomatoesaudience',value:81}] };
 if (id === 930005) return {};
 if (id === 930004) return { ratings: 'invalid' };
 if (id === 930009) return { error: 'test-mdblist-secret' };
 return { title: 'Should not be returned', ratings: [
  {source:'imdb',value:8.2,score:82,votes:12345},
  {source:'tomatoes',value:91},{source:'popcorn',value:86},{source:'metacritic',value:77},
 ] };
}
