var Handler={
		session:undefined,
		Data:undefined,
		callerInfo:undefined
}
Handler.entityPageLoad = function()
{
	ZOHO.CRM.INTERACTION.getPageInfo()
    .then(function(data)
    {
        console.log(data);
    });
}
Handler.widgetInit = function(data){
/*
 * Show loginPage here
 */
		if(RC.loggin)
		{
			Handler.showDialer();
		}
		else
		{
			Handler.RenderTemplate("login");
		}
		Handler.Init = true;
}
Handler.maximizePane = function(){
	ZOHO.CRM.UI.Dialer.maximize();
}
Handler.minimizePane  = function(){
	ZOHO.CRM.UI.Dialer.minimize();
}
Handler.RenderTemplate=function(templateId , data){
	var template = $("#"+templateId).html();
	var compiledTemplate = Handlebars.compile(template);
	var widgetsDiv =$("#widgetsDiv");
	widgetsDiv.html(compiledTemplate(data));
};
Handler.rcLogginSuccess = function(){
	Handler.showDialer();
	Handler.hideLoading();
};
Handler.rcIncomingCall= function(session){
	Handler.session = session;
	Handler.maximizePane();
	Handler.RenderTemplate("IncomingCall",Handler.getcallerInfo(Handler.session));
};
Handler.showDialer = function(){
	Handler.maximizePane();
	Handler.RenderTemplate("Dialer");
};
Handler.logOut = function(){
	RC.logOut();
	Handler.RenderTemplate("login");
	Handler.maximizePane();
	$('#logoutMenu').slideToggle();
};
Handler.showLogStatus = function(obj) {
	$(obj).toggleClass('active');
	var greyHght = $('.grey-bg').height();
	$('#logoutMenu').css({'top': greyHght})
	$('#logoutMenu').slideToggle();
}
Handler.enterNumber = function(ele){

	var number = $(ele).find("label").text();
	var inputBox = $("#dialNumber");
	if("Clear" === number){
		inputBox.val('');
	}
	else if ("Delete" === number){
		inputBox.val(inputBox.val().slice(0,-1))
	}
	else{
		inputBox.val(inputBox.val()+number);
	}
};
Handler.initiateCall = function(data){
	if(RC.loggin)
	{
		Handler.Data = data
		Handler.DialNumber(data.Number);
	}
	else
	{
		Handler.RenderTemplate("login");
		Handler.maximizePane();
	}
}
Handler.DialNumber = function(number){
	if(!number)
	{
		number = $("#dialNumber").val();
	}
	number = number+"";
	if(number.length > 0)
	{
		Handler.maximizePane();
		RC.makeCall(number);
		if(Handler.Data)
		{

			ZOHO.CRM.API.getRecord({
				Entity : Handler.Data.EntityType,
				RecordID : Handler.Data.EntityID
			})
			.then(function(data)
			{
				var name = data.Full_Name;
				Handler.callerInfo = {Name:name,Number:number};
				Handler.RenderTemplate("CallInProgress",Handler.callerInfo);
			});
		}
		else
		{
			Handler.RenderTemplate("CallInProgress",{Name:"Unknown",Number:number});
		}
	}
};
Handler.AnswerCall = function(){
	RC.answerCall(Handler.session, function(){
		Handler.RenderTemplate("CallInProgress",Handler.getcallerInfo(Handler.session));
	});
};
Handler.Hangup= function() {
	var callerInfo = Handler.callerInfo;
    try{
    	Handler.session.terminate();
    }catch(e){

    }

    if(Handler.Data)
    	{
	    	Handler.RenderTemplate("FeedBack",callerInfo);
    	}
    else{
    	Handler.showDialer();
    }
};
Handler.VolUp= function() {
    Handler.session.ua.audioHelper.setVolume(
        (Handler.session.ua.audioHelper.volume != null ? Handler.session.ua.audioHelper.volume : .5) + .1
    );
};
Handler.VolDown= function() {
    Handler.session.ua.audioHelper.setVolume(
        (Handler.session.ua.audioHelper.volume != null ? Handler.session.ua.audioHelper.volume : .5) - .1
    );
};
Handler.MuteUnmute = function(ele)
{
	ele = $(ele);
	var action = ele.attr("data-action");
	var textID = ele.attr("data-text-id");
	var iTag = ele.children("i");
	if(action === "mute"){
		ele.attr("data-action","unmute");

		iTag.removeClass("mute");
		iTag.addClass("unmute");

		$("#"+textID).text("Unmute")
		Handler.session.mute();
	}
	else if (action === "unmute")
	{
		iTag.removeClass("unmute");
		iTag.addClass("mute");

		ele.attr("data-action","mute");
		$("#"+textID).text("Mute")
		Handler.session.unmute();
	}

}
Handler.StartStopRecord = function(ele)
{
	ele = $(ele);
	var action = ele.attr("data-action");
	var iTag = ele.children("i");
	if(action === "start"){

		iTag.removeClass("record");
		iTag.addClass("offrecord");

		ele.attr("data-action","stop");
			Handler.session.startRecord().then(function() {console.log('Recording started'); })
		    .catch(function(e)
		    		{
		    	    		console.error('Recording start failed', e.stack || e);
		    	    });
	}
	else if (action === "stop")
	{
		iTag.removeClass("offrecord");
		iTag.addClass("record");

		ele.attr("data-action","start");
			Handler.session.stopRecord().then(function() {console.log('Recording stopped'); })
		    .catch(function(e)
		    		{
		    	    		console.error('Recording stop failed', e.stack || e);
		    	    });
	}

}
Handler.HoldUnhold = function(ele)
{

	ele = $(ele);
	var action = ele.attr("data-action");
	var textID = ele.attr("data-text-id");

	var iTag = ele.children("i");
	if(action === "hold"){
		ele.attr("data-action","unhold");

		iTag.removeClass("hold");
		iTag.addClass("unhold");

		$("#"+textID).text("Unhold")
	    Handler.session.hold().then(function() {console.log('OnHold'); })
	    .catch(function(e)
		{
	    		console.error('OnHold failed', e.stack || e);
	    });
	}
	else if (action === "unhold")
	{
		ele.attr("data-action","hold");

		iTag.removeClass("unhold");
		iTag.addClass("hold");

		$("#"+textID).text("Hold")
	    Handler.session.unhold().then(function() {console.log('UnHold'); })
	    .catch(function(e)
	    	{ console.error('UnHold failed', e.stack || e);
	    });
	}
}

Handler.saveNotes = function()
{
	Handler.showLoading()
	var notes = $("#calleeFeedBack").val();
	var title = $("#feedbacktopic").val();
	ZOHO.CRM.API.addNotes({
		Entity : Handler.Data.EntityType,
		RecordID : Handler.Data.EntityID,
		Title : title,
		Content : notes
	})
	.then(function(data)
	{
		Handler.hideLoading();
		Handler.showDialer();
		Handler.Data = undefined;
	});
}

/*
 * util methods
 */
Handler.getcallerInfo = function(session)
{
	var callerInfo = {
			Name:session.request.from.displayName,
			Number:"Unknown",
	};
	return callerInfo;
}
Handler.showLoading = function(){
	$("#loadingDiv").show();
}
Handler.hideLoading = function(){
	$("#loadingDiv").hide();
}
Handler.successMsg = function(message){
	$('.successMsg').text(message);
	 $('.successMsg').slideDown(function() {
			$('.successMsg').delay(3000).slideUp();
			});
}
Handler.initiateLogin = function(event){
	var login = $("#rcLogin").val();
	var pass = $("#rcPassword").val();
	var ext = $("#rcExtension").val();
	RC.login(RC.config.Server, RC.config.AppKey, RC.config.AppSecret, login,ext, pass,RC.config.LogLevel); //no i18n
	Handler.RenderTemplate("LoginWait");
	Handler.minimizePane();

}
