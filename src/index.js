(function init() {
  fetch("https://cd-static.bamgrid.com/dp-117731241344/home.json")
    .then((response) => response.json())
    .then(({data}) => {
      // Get all categories
      const categories = data.StandardCollection.containers.reduce(
        (acc, { set }, index) => {
          let size = 0;
          let refId = null;
          let setId = null;

          if (set.meta && set.meta.page_size) size = set.meta.page_size;
          if (set.refId) refId = set.refId;
          if (set.setId) setId = set.setId;

          acc[index] = {
            title: set.text.title.full.set.default.content,
            id: setId,
            refId,
            size,
          };
          return acc;
        },
        {}
      );

      // get all content in matrix format
      const content = data.StandardCollection.containers.map(({ set }) => {
        if (!set.items) return [];
        return set.items;
      });

      const mouse = new Mouse(categories, content);
      mouse.populateContent($("#app"));

      // set how much of the category block do we need to see
      // 	before we act on it
      const options = {
        threshold: 0.6,
      };
      // bind the mouse object to the observer so we can use
      // it's methods/properties with in the observer callback
      const categoryMouseObserver = categoryObserver.bind(mouse);

      const observer = new IntersectionObserver(categoryMouseObserver, options);

      // loop through the categories to observe
      [...$(".category")].forEach((category) => {
        observer.observe(category, observer);
      });

      $("body").on("keydown", function (event) {
        const keyMap = {
          38: "up",
          40: "down",
          37: "left",
          39: "right",
        };

        if (Object.keys(keyMap).includes(`${event.which}`)) {
          event.preventDefault();
          mouse.moveFocus(keyMap[`${event.which}`]);

          if (
            keyMap[`${event.which}`] === "down" ||
            keyMap[`${event.which}`] === "up"
          ) {
            const focusedTile = document.querySelector(
              ".category__item--focused"
            );

            window.scrollTo({
              left: 0,
              top:
                focusedTile.offsetTop +
                focusedTile.offsetHeight -
                window.innerHeight / 2,
              behavior: "smooth",
            });
          }
        }
      });
    })
    .catch((err) => console.error(err));
})();
