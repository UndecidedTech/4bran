<template>
  <span class="boardList">
        [
        <span v-for="(board, index) in boards" :key="index">
                <span v-if="(index + 1) < boards.length">
                    <span class="link" @click="goBoard(board.name)">
                        {{ board.name }}
                    </span>
                    /
                </span>
                <span v-else>
                    <span class="link" @click="goBoard(board.name)">
                        {{ board.name }}
                    </span>
                </span>
        </span>
        ]
        <span class="navTopRight">
            [
            <a class="boards" href="/">
                Home
            </a>
            ]
        </span>
    </span>
</template>

<script>
export default {
    name: "navBar",
    data() {
        return {
            boards: [
                {
                    "name": "a",
                    "title": "Anime and Cartoons"
                },
                {
                    "name": "b",
                    "title": "Random"
                },
                {
                    "name": "g",
                    "title": "Technology"
                },
                {
                    "name": "tv",
                    "title": "Television and Film"
                },
                {
                    "name": "v",
                    "title": "Video Games"
                },
                {
                    "name": "vg",
                    "title": "Video Games Generals"
                },
                {
                    "name": "k",
                    "title": "Weapons"
                },
                {
                    "name": "o",
                    "title": "Auto"
                },
                {
                    "name": "out",
                    "title": "Outdoors"
                },
                {
                    "name": "sp",
                    "title": "Sports"
                },
                {
                    "name": "lit",
                    "title": "Literature"
                },
                {
                    "name": "mu",
                    "title": "Music"
                },
                {
                    "name": "wsg",
                    "title": "Worksafe GIF"
                },
                {
                    "name": "biz",
                    "title": "Business & Finance"
                },
                {
                    "name": "fit",
                    "title": "Fitness"
                },
                {
                    "name": "pol",
                    "title": "Politically Incorrect"
                },
                {
                    "name": "h",
                    "title": "Hentai"
                },
                {
                    "name": "fa",
                    "title": "Fashion"
                }
        ]}
    },
    methods: {
        goBoard(boardName){
            this.$router.push({path: `/${boardName}/catalog`, params: {board: boardName}});
        }
    }
}
</script>

<style>
.boardList {
    font-size: 9pt;
    color: #89a;
    display: block;
}

.boards {
    font-weight: 400;
    padding: 1px;
    text-decoration: none;
    color: #34345c;
}

.navTopRight {
    float: right;
}

.link {
    background: none!important;
    border: none;
    color: #34345c;
    cursor: pointer;
}
</style>