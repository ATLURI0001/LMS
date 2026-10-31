import React from 'react'
import ab from './about.jpg'


const About = () => {
  return (
    <>
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-5">
                <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.1s" >
                    <div class="position-relative h-100">
                        <img class="img-fluid position-absolute w-100 h-100" src={ab}/>
                    </div>
                </div>
                <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.3s">
                    <h6 class="section-title bg-white text-start text-primary pe-3">About Us</h6>
                    <h1 class="mb-4">Welcome to eduLEARNING</h1>
                    <p class="mb-4">Students do not learn much just sitting in classes listening to teachers, memorizing prepackaged assignments, and spitting out answers. They must talk about what they are learning, write reflectively about it, relate it to past experiences, and apply it to their daily lives. They must make what they learn part of themselves.</p>
                    <p class="mb-4">It’s time to step up to the plate and get passionate about your work commit to making eLearning courses that don't bore people to tears, but instead inspire and motivate them to learn a new skill, change a certain behavior, or improve their performance..</p>
                    <div class="row gy-2 gx-4 mb-4"> 
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Skilled Instructors</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Online Courses</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Chat with Teachers</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Get Study Materials</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Weekly Assignments</p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-0"><i class="fa fa-arrow-right text-primary me-2"></i>Self-Learning</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  )
}

export default About