'use strict';
PeopelService.$inject = ['ENV', '$firebase'];
PeopleChat.$inject = ['$firebase', 'People'];
angular
    .module('ion-chat', [])
    .factory('People', PeopelService)
    .factory('PeopleChat', PeopleChat)

function PeopelService (ENV, $firebase) {

	var ref = new Firebase(ENV.FIREBASE_URL+'users');
	var people = $firebase().$asArray();

	return {
		all: function(){
			return people;
		},
		get: function(peopleID) {
			if(peopleID) {
				return people.$getRecord(peopleID);
			} else {
				return null;
			}
		}
	};
}
function PeopleChat ($firebase, People) {

	var selectedPeopleID;
	var invitedPeopleID;
	var ref = new Firebase(firebaseUrl);
	var peoplechats;
	var peoplechatsReverse;

	return {
		all: function() {
			return peoplechats;
		},
		remove: function(peoplechat) {
			peoplechats.$remove(peoplechat).then(function (ref) {
				ref.key() === peoplechat.$id;
			});
		},
		get: function(peoplechatID) {
			for (var i = 0; i < peoplechats.length; i++) {
				if(peoplechats[i].id === parseInt(peoplechatID)) {
					return peoplechats[i];
				}
			}
			return null;
		},
		getSelectedPeopleName: function(){
			var selectedPeople;
			if (selectedPeopleID && selectedPeopleID !== null) {
				selectedPeople = People.get(selectedPeopleID);
				if (selectedPeople){
					return selectedPeople.displayName;
				} else {
					return null;
				}
			} else {
				return null;
			}
		},
		selectPeople: function(peopleID, currentID) {
			console.log('Selecting the person with ID: ' + peopleID);
			selectedPeopleID = peopleID;
			invitedPeopleID = currentID;
			if(peopleID && currentID){
				peoplechats = $firebase(ref.child('users').child(selectedPeopleID).child('peoplechats').child(invitedPeopleID)).$asArray();
				peoplechatsReverse = $firebase(ref.child('users').child(invitedPeopleID).child('peoplechats').child(selectedPeopleID)).$asArray();
			}
		},
		send: function(from, message) {
			console.log('Sending message from: ' + from.displayName + ' and the message is: ' + message);
			if (from && message) {
				var peoplechatMessage = {
					from: from.displayName,
					message: message,
					createdAt: Firebase.ServerValue.TIMESTAMP
				};
				// var peoplechatMessageReverse = {
				// 	from: fromReverse,
				// 	message: message,
				// 	createdAt: Firebase.ServerValue.TIMESTAMP
				// };
				peoplechats.$add(peoplechatMessage).then(function (data) {
					console.log('Message added: ' + data);
				});
				peoplechatsReverse.$add(peoplechatMessage).then(function (data) {
					console.log('Message added: ' + data);
				});
			}
		}
	};
}
