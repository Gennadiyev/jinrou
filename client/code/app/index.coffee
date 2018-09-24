# クライアント側のページを集約する
module.exports=
    user:
        profile:require '/user/profile'
        view:require '/user/view'
        graph:require '/user/graph'
        color:require '/user/color'
        mylog:require '/user/mylog'
        settings:require '/user/settings'
    game:
        rooms:require '/game/rooms'
        newroom:require '/game/newroom'
        game:require '/game/game'
    lobby:require '/lobby'
    manual:require '/manual'
    admin:require '/admin'
    logs:require '/logs'
    reset:require '/reset'
    pages:
        casting:require '/pages/casting'
        castlist:require '/pages/castlist'
    top:require '/top'
    # ちょっと違うけど
    app:require '/app'
    util:require '/util'
    socket:require '/socket'





