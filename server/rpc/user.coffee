# Server-side Code
Shared=
    game:require '../../client/code/shared/game.coffee'
    prize:require '../../client/code/shared/prize.coffee'
Server=
    user:module.exports
    prize:require '../prize.coffee'
    oauth:require '../oauth.coffee'
mailer=require '../mailer.coffee'
crypto=require 'crypto'
url=require 'url'

# 内部関数的なログイン
login= (query,req,cb,ss)->
    auth=require('./../auth.coffee')
    #req.session.authenticate './session_storage/internal.coffee', query, (response)=>
    auth.authenticate query,(response)=>
        if response.success
            req.session.setUserId response.userid
            #console.log "login."
            #console.log req
            response.ip=req.clientIp
            req.session.user=response
            #req.session.room=null  # 今入っている部屋
            req.session.channel.reset()
            req.session.save (err)->
                # お知らせ情報をとってきてあげる
                M.news.find().sort({time:-1}).nextObject (err,doc)->
                    cb {
                        login:true
                        lastNews:doc?.time
                    }
                # IPアドレスを記録してあげる
                M.users.update {"userid":response.userid},{$set:{ip:response.ip}}
        else
            cb {
                login:false
            }

exports.actions =(req,res,ss)->
    req.use 'user.fire.wall'
    req.use 'session'

# ログイン
# cb: 失敗なら真
    login: (query)->
        login query,req,res,ss
    
# ログアウト
    logout: ->
        #req.session.user.logout(cb)
        req.session.setUserId null
        req.session.channel.reset()
        req.session.save (err)->
            res()
            
# 新規登録
# cb: 错误メッセージ（成功なら偽）
    newentry: (query)->
        unless /^\w+$/.test(query.userid)
            res {
                login:false
                error:"ID包含了非法字符"
            }
            return
        unless /^\w+$/.test(query.password)
            res {
                login:false
                error:"密码包含了非法字符"
            }
            return
        M.users.find({"userid":query.userid}).count (err,count)->
            if count>0
                res {
                    login:false
                    error:"这个ID已被使用"
                }
                return
            userobj = makeuserdata(query)
            M.users.insert userobj,{safe:true},(err,records)->
                if err?
                    res {
                        login:false
                        error:"DB err:#{err}"
                    }
                    return
                login query,req,res,ss
                
# ユーザー数据が欲しい
    userData: (userid,password)->
        M.users.findOne {"userid":userid},(err,record)->
            if err?
                res null
                return
            if !record?
                res null
                return
            delete record.password
            delete record.prize
            #unless password && record.password==SS.server.user.crpassword(password)
            #   delete record.email
            res record
    myProfile: ->
        unless req.session.userId
            res null
            return
        u=JSON.parse JSON.stringify req.session.user
        if u
            res userProfile(u)
        else
            res null
# お知らせをとってきてもらう
    getNews:->
        M.news.find().sort({time:-1}).limit(5).toArray (err,results)->
            if err?
                res {error:err}
                return
            res results
# twitter头像を調べてあげる
    getTwitterIcon:(id)->
        Server.oauth.getTwitterIcon id,(url)->
            res url
        
                
# 配置变更 返り値=变更後 {"error":"message"}
    changeProfile: (query)->
        M.users.findOne {"userid":req.session.userId,"password":Server.user.crpassword(query.password)},(err,record)=>
            if err?
                res {error:"DB err:#{err}"}
                return
            if !record?
                res {error:"用户认证失败"}
                return
            if query.name?
                if query.name==""
                    res {error:"请输入昵称"}
                    return
                record.name=query.name

            #max bytes of nick name
            maxLength=20
            record.name = record.name.trim()
            if record.name == ''
                res {error:"昵称不能仅为空格"}
                return
            else if record.name.replace(/[^\x00-\xFF]/g,'**').length > maxLength
                res {error:"昵称不能超过"+maxLength+"个字节。"}
                return

            if query.comment? && query.comment.length<=200
                record.comment=query.comment
            if query.icon? && query.icon.length<=300
                record.icon=query.icon
            M.users.update {"userid":req.session.userId}, record, {safe:true},(err,count)=>
                if err?
                    res {error:"配置变更失败"}
                    return
                delete record.password
                req.session.user=record
                req.session.save ->
                res userProfile(record)
    sendConfirmMail:(query)->
        mailer.sendConfirmMail(query,req,res,ss)
    confirmMail:(query)->
        if query.match /\/my\?token\=(\w){128}\&timestamp\=(\d){13}$/
            query = url.parse(query,true).query
            # console.log query
            M.users.findOne {"mail.token":query.token,"mail.timestamp":Number(query.timestamp)},(err,doc)->
                # 有效时间：1小时
                if err?
                    res {error:"验证链接无效或已经过期"}
                    return
                unless doc?.mail? && Date.now() < Number(doc.mail.timestamp) + 3600*1000
                    res {error:"验证链接无效或已经过期"}
                    return
                strfor=doc.mail.for
                switch doc.mail.for
                    when "confirm"
                        doc.mail=
                            address:doc.mail.new
                            verified:true
                    when "change"
                        doc.mail=
                            address:doc.mail.new
                            verified:true
                    when "remove"
                        delete doc.mail
                    when "reset"
                        doc.password = doc.mail.newpass
                        doc.mail=
                            address:doc.mail.address
                            verified:true
                M.users.update {"userid":doc.userid}, doc, {safe:true},(err,count)=>
                    if err?
                        res {error:"邮箱绑定失败"}
                        return
                    delete doc.password
                    req.session.user = doc
                    req.session.save ->
                        if strfor in ["confirm","change"]
                            doc.info="邮箱「#{doc.mail.address}」认证成功。"
                        else if strfor == "remove"
                            doc.mail=
                                address:""
                                verified:false
                            doc.info="邮箱解除认证成功。"
                        else if strfor == "reset"
                            doc.info="密码重置成功，请重新登陆。"
                            doc.reset=true
                        res doc
            return
        res null
    resetPassword:(query)->
        unless /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/.test query.mail
            res {info:"邮箱格式不正确"}
        query.userid = query.userid.trim()
        query.mail = query.mail.trim()
        if query.newpass!=query.newpass2
            res {error:"两次输入的密码不一致"}
            return
        M.users.findOne {"userid":query.userid,"mail.address":query.mail,"mail.verified":true},(err,record)=>
            if err?
                res {error:"DB err:#{err}"}
                return
            if !record?
                res {error:"账号或邮箱不正确"}
                return
            else
                mailer.sendResetMail(query,req,res,ss)
                return
    changePassword:(query)->
        M.users.findOne {"userid":req.session.userId,"password":Server.user.crpassword(query.password)},(err,record)=>
            if err?
                res {error:"DB err:#{err}"}
                return
            if !record?
                res {error:"用户认证失败"}
                return
            if query.newpass!=query.newpass2
                res {error:"两次输入的密码不一致"}
                return
            M.users.update {"userid":req.session.userId}, {$set:{password:Server.user.crpassword(query.newpass)}},{safe:true},(err,count)=>
                if err?
                    res {error:"配置变更失败"}
                    return
                res null
    usePrize: (query)->
        # 表示する称号を変える query.prize
        M.users.findOne {"userid":req.session.userId,"password":Server.user.crpassword(query.password)},(err,record)=>
            if err?
                res {error:"DB err:#{err}"}
                return
            if !record?
                res {error:"用户认证失败"}
                return
            if typeof query.prize?.every=="function"
                # 称号構成を得る
                comp=Shared.prize.getPrizesComposition record.prize.length
                if query.prize.every((x,i)->x.type==comp[i])
                    # 合致する
                    if query.prize.every((x)->
                        if x.type=="prize"
                            !x.value || x.value in record.prize # 持っている称号のみ
                        else
                            !x.value || x.value in Shared.prize.conjunctions
                    )
                        # 所持もOK
                        M.users.update {"userid":req.session.userId}, {$set:{nowprize:query.prize}},{safe:true},(err)=>
                            req.session.user.nowprize=query.prize
                            req.session.save ->
                                res null
                    else
                        console.log "invalid1 ",query.prize,record.prize
                        res {error:"称号无效"}
                else
                    console.log "invalid2",query.prize,comp
                    res {error:"称号无效"}
            else
                console.log "invalid3",query.prize
                res {error:"称号无效"}
        
# 成績をくわしく見る
    getMyuserlog:->
        unless req.session.userId
            res {error:"请登陆"}
            return
        myid=req.session.userId
        # DBから自己のやつを引っ張ってくる
        results=[]
        M.userlogs.findOne {userid:myid},(err,doc)->
            if err?
                console.error err
            unless doc?
                # 戦績数据がない
                res null
                return
            res doc
    
    ######
            


#密码ハッシュ化
#   crpassword: (raw)-> raw && hashlib.sha256(raw+hashlib.md5(raw))
exports.crpassword= (raw)->
        return "" unless raw
        sha256=crypto.createHash "sha256"
        md5=crypto.createHash "md5"
        md5.update raw  # md5でハッシュ化
        sha256.update raw+md5.digest 'hex'  # sha256でさらにハッシュ化
        sha256.digest 'hex' # 结果を返す
#ユーザー数据作る
makeuserdata=(query)->
    {
        userid: query.userid
        password: Server.user.crpassword(query.password)
        name: query.userid
        icon:"" # iconのURL
        comment: ""
        win:[]  # 勝ち試合
        lose:[] # 負け試合
        gone:[] # 行方不明試合
        ip:""   # IPアドレス
        prize:[]# 现在持っている称号
        ownprize:[] # 何かで与えられた称号（prizeに含まれる）
        nowprize:null   # 现在设定している肩書き
                # [{type:"prize",value:(prizeid)},{type:"conjunction",value:"が"},...]
    }

# profileに表示する用のユーザーデータをdocから作る
userProfile = (doc)->
    doc.wp = unless doc.win? && doc.lose?
        "???"
    else if doc.win.length+doc.lose.length==0
        "???"
    else
        "#{(doc.win.length/(doc.win.length+doc.lose.length)*100).toPrecision(2)}%"
    # 称号の処理をしてあげる
    doc.prize ?= []
    doc.prizenames = doc.prize.map (x)->{id:x,name:Server.prize.prizeName(x),phonetic:Server.prize.prizePhonetic(x) ? null}
    delete doc.prize
    if !doc.mail?
        doc.mail =
            address:""
            new:""
            verified:false
    else
        doc.mail =
            address:doc.mail.address
            new:doc.mail.new
            verified:doc.mail.verified
    return doc
