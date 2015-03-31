function join(hostId){
	hostId = hostId.trim();
	if (hostId.length < 1) {
		alert('주소를 입력해주세요');
		return;
	}
	var peer = newPeer();
	var conn = peer.connect(hostId, {
		serialization: 'json', // 네트워크 레이턴시따위...=3 데이터 패킹에 드는 퍼포먼스 저하는 피하고 싶다.
		reliable: true // 데이터 손실은 가능하면 피하자.
	});
	conn.on('open', function () {
		conn.removeAllListeners('open');
		peer.removeAllListeners();
		peer.disconnect();
		// guest는 host에 대한 연결 하나만 잡고있으면 된다.
		// peerjs의 동시 접속 제한이 50개 까지므로 가능하면 서버연결을 유지하지 않는 것이 좋다.
		var dataQueue = [];
		conn.on('data', function (data) {
			dataQueue.push(data);
		});
		// guest_waiting이 실행되기 전에 들어온 이벤트들은 우선 큐에 쌓는다.
		setTimeout(guest_waiting, 0,
			conn, dataQueue
		);
	});
	peer.on('error', function (err) {
		peer.destroy();
		switch (err.type) {
		case 'peer-unavailable':
			alert([
				'해당 주소로 열려있는 판이 없거나 이미 시작된 판인 것 같습니다.',
				'정확한 주소가 입력됐는지 확인해주세요.'
			].join('\n'));
			break;
		case 'disconnected':
			// TODO: 이미 시작된 판인게 아니면... 음... 어떤 경우에 여기로 타는지 확인
			alert([
				'이미 시작된 판에는 참여할 수 없답니다.',
				'새로운 판을 열거나 다른 판에 참여해주세요.'
			].join('\n'));
			break;
		default:
			alert([
				'접속에 문제가 발생했는데 왜 그런지 모르겠네요.',
				'다시 시도해보시고 문제가 지속된다면 다음의 내용을 개발자(jong@chan.moe)한테 알려주세요.',
				'판 끼어들기 시에 ' + err.type + '발생'
			].join('\n'));
			break;
		}
		$joinButton.prop('disabled', false);
	});
}

(function joinNow(){
	var hostId = urlParam.get('host');

	if(typeof hostId !== 'undefined'){
		join(hostId);
	}
})();
