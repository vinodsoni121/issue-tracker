const express=require('express');
const app=express();
const PORT=process.env.PORT || 3000;                                    //setting port 3000
const path=require('path');
const db=require('./config/mongoose');              //importing database connection
const Project=require('./models/projects');         //importing project model  
const Issue=require('./models/issues');             //importing issue model

app.set('view engine','ejs');                       //setting up view engine
app.set('views',path.join(__dirname,'./views'));    //setting up views directory
app.use(express.urlencoded({extended:true}));       
app.use(express.static(path.join(__dirname,'./assets')));       //setting up assets directory

//home route handler to get project list
app.get('/',async (req,res)=>{
    try{
        let projectList=await Project.find({});     //fetching Project List
        return res.render('home',{projectList});    //sending Project List in locals
    }
    catch(e){
        return console.log(e);
    }
});

//route handler to create project
app.post('/createProject',async (req,res)=>{
    try{
        let newProject=await Project.create({name:req.body.name,author:req.body.author,description:req.body.description});          //creating new project
        console.log(newProject);                                                                                                    //printing new project
        return res.redirect('back');
    }
    catch(e){
        return console.log(e);
    }
});

//route handler to view specific project
app.get('/viewProject',async (req,res)=>{
    try{
        let curProject=await Project.findById(req.query.project).populate({path:'issues'});     //fetching project by req.query,id
        let cur_project_issues=curProject.issues;                                               //storing current project issues in array.

        let allLabels=[];
        let allTitles=[];
        let allDescriptions=[];
        let allAuthors=[];

        let allIssues=await Issue.find({});                                                     //fetching all issues

        allIssues.forEach((i)=>{
        let al=i.labels;
        al.forEach((j)=>allLabels=[...allLabels,j]);                                            //storing all labels in allLabels array
        allTitles=[...allTitles,i.title]                                                        //storing all titles in allTitles array
        allDescriptions=[...allDescriptions,i.description]                                      //storing all descriptions in allDescriptions array
        allAuthors=[...allAuthors,i.author]                                                     //storing all authors in allAuthors array
        });

        allLabels=[...new Set(allLabels)]       //removing duplicates
        allTitles=[...new Set(allTitles)]       //removing duplicates
        allDescriptions=[...new Set(allDescriptions)]       //removing duplicates
        allAuthors=[...new Set(allAuthors)]       //removing duplicates

        return res.render('viewProject',{curProject,cur_project_issues,allLabels,allTitles,allDescriptions,allAuthors});
        //rendering viewProject view with current proeject (with issues), all labels, all titles, all descriptions, all authors.
    }
    catch(e){
        return console.log(e);
    }
});

//route handler to filter a project by labels, author , title and description
app.post('/viewProject',async (req,res)=>{
    let findIssue='';
    let curProject='';
    if(req.body.selectAuthor!=0){
        findIssue=await Issue.findOne({author:req.body.selectAuthor});                                          //fetching issue by author

        if(findIssue)
        curProject=await Project.findById(findIssue.projectID).populate({path:'issues'});                 
    }
    else if(req.body.selectDescription!=0 && req.body.selectTitle!=0){
        findIssue=await Issue.findOne({description:req.body.selectDescription,title:req.body.selectTitle});     //fetching issue by auhtor & description

        if(findIssue)
        curProject=await Project.findById(findIssue.projectID).populate({path:'issues'});
    }
    else if(req.body.selectLabels!=undefined){

        let arrayLables=req.body.selectLabels;                                                                  //storing all labels in array fetched from body
        var idsArray=[];

        for(i of arrayLables){
            let issue =await Issue.findOne({labels:{$in:i}});
            idsArray.push(issue.projectID);                                                                     //string all proejct ids of fetched labels
        }

        //checking most occured label
        let mf = 1;
        let m = 0;
        let projectID;
        for (let i=0; i<idsArray.length; i++)
        {
                for (let j=i; j<idsArray.length; j++)
                {
                        if (idsArray[i] == idsArray[j])
                        m++;
                        if (mf<m)
                        {
                        mf=m; 
                        projectID = idsArray[i];
                        }
                }
                m=0;
        }
        curProject=await Project.findById(projectID).populate({path:'issues'});                                     //fetching project after filering most occured projects id
    }

    console.log(curProject);
    let cur_project_issues=curProject.issues;

    let allLabels=[];
    let allTitles=[];
    let allDescriptions=[];
    let allAuthors=[];

    let allIssues=await Issue.find({});                                                                             //fetching all issues

    allIssues.forEach((i)=>{
    let al=i.labels;
    al.forEach((j)=>allLabels=[...allLabels,j]);                                            //storing all labels in allLabels array
    allTitles=[...allTitles,i.title]                                                        //storing all titles in allTitles array
    allDescriptions=[...allDescriptions,i.description]                                      //storing all descriptions in allDescriptions array
    allAuthors=[...allAuthors,i.author]                                                     //storing all authors in allAuthors array
    });

    allLabels=[...new Set(allLabels)]       //removing duplicates
    allTitles=[...new Set(allTitles)]       //removing duplicates
    allDescriptions=[...new Set(allDescriptions)]       //removing duplicates
    allAuthors=[...new Set(allAuthors)]       //removing duplicates

    return res.render('viewProject',{curProject,cur_project_issues,allLabels,allTitles,allDescriptions,allAuthors});
});

//route handler to create an issue on a project
app.post('/createIssue',async (req,res)=>{
    try{
        let str=req.body.labels.split(',');                                         //getting labels array from body
        let filtered = str.filter(function (el) {
            return el != '';                                                        //removing extra ','
        });
        filtered = filtered.map(element => {                                        //capitalizing all labels
            return element.toUpperCase();
        });

        let newIssue=await Issue.create({title:req.body.title,description:req.body.description,labels:filtered,author:req.body.author,projectID:req.body.projectID});
        //creating new issue

        let update=await Project.findByIdAndUpdate(req.body.projectID,{$push:{"issues":newIssue.id}});
        //finding project by project id

        return res.writeHead(301, {
            Location: `http://localhost:3000/viewProject/?project=${req.body.projectID}`
          }).end();
        //redirecting to viewProject
    }
    catch(e){
        return console.log(e);
    }
});

// delete project
app.get('/delete-project',function(req,res){
    
    let id=req.query.id;
    Project.findByIdAndDelete(id,function(err){
        if(err){
            console.log("oops something error");
            return;
        }
        Issue.find({projectID: id}, function(err,ps){
            console.log(ps);
            for(var i = 0 ; i < ps.length ; i++){
                Issue.findOneAndDelete({projectID: id},function(err){
                    if(err){
                        console.log('error in deleting an object from database');
                        return;
                    }
                })
            }
        })
        return res.redirect('/');
    })
})

//delete project issues
app.get('/delete-issue',function(req,res){
    
    let id=req.query.id;
    Issue.findByIdAndDelete(id,function(err){
        if(err){
            console.log("oops something error");
            return;
        }
        return res.redirect('back');
    })
})
//route handler to start listening on port 3000
app.listen(PORT,(error)=>{
    if(error)
    console.log(error);
    console.log(`Started listening on PORT ${PORT}`);
});
